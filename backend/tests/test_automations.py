import json
from decimal import Decimal
from app.models.agency import Agency
from app.models.lead import Lead, LeadActivity
from app.models.automation import WebhookEventLog
from app.services.automation_service import AutomationService


def test_automation_config_endpoints(client, test_data, owner_auth_headers, agent_auth_headers):
    # 1. Agent should get 403 trying to view or edit automation config
    res_agent = client.patch(
        "/api/v1/automations/config",
        headers=agent_auth_headers,
        json={"whatsapp_enabled": True},
    )
    assert res_agent.status_code == 403

    # 2. Owner fetches automation config
    res_get = client.get("/api/v1/automations/config", headers=owner_auth_headers)
    assert res_get.status_code == 200
    data = res_get.json()
    assert "official_whatsapp_compliance" in data
    assert "has_webhook_secret" in data
    assert "n8n_webhook_secret" not in data  # Never expose raw secret!

    # 3. Owner updates automation config
    res_patch = client.patch(
        "/api/v1/automations/config",
        headers=owner_auth_headers,
        json={
            "n8n_webhook_url": "https://n8n.propstackly-internal.pk/webhook/lead-event",
            "n8n_webhook_secret": "test_hmac_secret_key_84920",
            "whatsapp_enabled": True,
            "whatsapp_template_name": "welcome_lead_intro",
            "followup_reminder_minutes_before": 45,
        },
    )
    assert res_patch.status_code == 200
    patched = res_patch.json()
    assert patched["whatsapp_enabled"] is True
    assert patched["has_webhook_secret"] is True
    assert patched["followup_reminder_minutes_before"] == 45
    assert patched["n8n_webhook_url"] == "https://n8n.propstackly-internal.pk/webhook/lead-event"


def test_hmac_signature_generation_and_validation():
    secret = "my_agency_webhook_secret_123"
    payload = b'{"event":"lead.created","lead_id":"abc-123"}'

    signature = AutomationService.compute_hmac_signature(secret, payload)
    assert signature.startswith("sha256=")

    # Valid signature
    assert AutomationService.verify_hmac_signature(secret, payload, signature) is True
    # Tampered payload
    tampered_payload = b'{"event":"lead.created","lead_id":"hacked-999"}'
    assert AutomationService.verify_hmac_signature(secret, tampered_payload, signature) is False
    # Invalid secret
    assert AutomationService.verify_hmac_signature("wrong_secret", payload, signature) is False


def test_inbound_provider_callback_marks_message_confirmed(client, db_session, test_data):
    agency = test_data["agency_1"]
    lead = test_data["lead_agent"]
    secret = "webhook_secret_for_callback_test"

    agency.n8n_webhook_secret = secret
    db_session.commit()

    # Pre-create an outbound event log in 'delivered' state
    outbound_log = WebhookEventLog(
        agency_id=agency.id,
        lead_id=lead.id,
        event_type="lead.created",
        status="delivered",
        direction="outbound",
        payload='{"lead_name":"Buyer"}',
        recipient_phone=lead.phone,
        template_name="welcome_lead_intro",
        idempotency_key=f"lead_created_{lead.id}",
    )
    db_session.add(outbound_log)
    db_session.commit()
    db_session.refresh(outbound_log)

    callback_payload = {
        "event_id": outbound_log.id,
        "lead_id": lead.id,
        "status": "delivered",
        "provider_message_id": "wamid.HBgMOTEzMDExMTIyMzM0FQIAEhggM0E0RjA1",
        "recipient_phone": lead.phone,
        "template_name": "welcome_lead_intro",
    }
    raw_json = json.dumps(callback_payload).encode("utf-8")
    signature = AutomationService.compute_hmac_signature(secret, raw_json)

    # 1. Reject if invalid signature provided
    res_invalid = client.post(
        f"/api/v1/automations/webhooks/n8n/callback?agency_id={agency.id}",
        content=raw_json,
        headers={"Content-Type": "application/json", "X-PropStackly-Signature": "sha256=invalid_hash"},
    )
    assert res_invalid.status_code == 401

    # 2. Accept with valid signature (testing X-PropStackly-Signature)
    res_valid = client.post(
        f"/api/v1/automations/webhooks/n8n/callback?agency_id={agency.id}",
        content=raw_json,
        headers={"Content-Type": "application/json", "X-PropStackly-Signature": signature},
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["confirmed"] is True

    # 3. Verify event log is now 'confirmed'
    db_session.refresh(outbound_log)
    assert outbound_log.status == "confirmed"
    assert outbound_log.provider_message_id == "wamid.HBgMOTEzMDExMTIyMzM0FQIAEhggM0E0RjA1"
    assert outbound_log.confirmed_at is not None

    # 4. Verify LeadActivity was recorded on the lead
    activity = (
        db_session.query(LeadActivity)
        .filter(LeadActivity.lead_id == lead.id, LeadActivity.type == "whatsapp")
        .first()
    )
    assert activity is not None
    assert "welcome_lead_intro" in activity.description


def test_inbound_provider_failure_callback(client, db_session, test_data):
    agency = test_data["agency_1"]
    lead = test_data["lead_agent"]
    secret = "callback_failure_secret"

    agency.n8n_webhook_secret = secret
    db_session.commit()

    callback_payload = {
        "lead_id": lead.id,
        "status": "failed",
        "error_message": "Meta Graph API: Phone number +923001112233 not registered on WhatsApp.",
        "recipient_phone": lead.phone,
    }
    raw_json = json.dumps(callback_payload).encode("utf-8")
    signature = AutomationService.compute_hmac_signature(secret, raw_json)

    res = client.post(
        f"/api/v1/automations/webhooks/n8n/callback?agency_id={agency.id}",
        content=raw_json,
        headers={"Content-Type": "application/json", "X-PropStackly-Signature": signature},
    )
    assert res.status_code == 200
    assert res.json()["confirmed"] is False

    # Check lead activity shows failure
    activity = (
        db_session.query(LeadActivity)
        .filter(LeadActivity.lead_id == lead.id, LeadActivity.title == "WhatsApp Delivery Failed")
        .first()
    )
    assert activity is not None
    assert "Phone number +923001112233 not registered" in activity.description


def test_run_reminders_api_endpoint(client, owner_auth_headers):
    res = client.post("/api/v1/automations/run-reminders", headers=owner_auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "agencies_processed" in body
    assert "upcoming_reminders_sent" in body
    assert "overdue_reminders_sent" in body
