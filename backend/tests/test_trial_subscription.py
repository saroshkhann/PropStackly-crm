from datetime import datetime, timezone, timedelta
import pytest
from app.models.agency import Agency


def test_agency_trial_defaults(client, owner_auth_headers):
    # Verify settings endpoint returns trial defaults
    res = client.get("/api/v1/settings/agency", headers=owner_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["subscription_status"] in ("trial", "active")


def test_trial_expiration_blocks_mutating_actions(client, owner_auth_headers, db_session):
    # Retrieve current agency
    me_res = client.get("/api/v1/auth/me", headers=owner_auth_headers)
    agency_id = me_res.json()["agency"]["id"]

    agency = db_session.query(Agency).filter(Agency.id == agency_id).first()
    original_status = agency.subscription_status
    original_trial_end = agency.trial_ends_at

    try:
        # Simulate expired trial (ended yesterday)
        agency.subscription_status = "trial"
        agency.trial_ends_at = datetime.now(timezone.utc) - timedelta(days=1)
        agency.subscription_expires_at = None
        db_session.commit()

        # Attempt to create lead -> Must return 402 Payment Required
        lead_payload = {
            "full_name": "Trial Expiration Test Lead",
            "phone": "+923009999888",
            "email": "trial.expired@example.com",
            "city": "Islamabad",
            "source": "Website",
            "budget_pkr": 10000000,
        }
        res = client.post("/api/v1/leads", json=lead_payload, headers=owner_auth_headers)
        assert res.status_code == 402, f"Expected 402 Payment Required, got {res.status_code}"
        assert "trial has concluded" in res.json()["detail"].lower()

        # Reset trial via API (Owner action)
        reset_res = client.post(
            "/api/v1/settings/agency/reset-trial",
            json={"trial_days": 3},
            headers=owner_auth_headers,
        )
        assert reset_res.status_code == 200
        assert reset_res.json()["subscription_status"] == "trial"

        # Now creating lead should succeed (or return 201/400 for duplicate)
        res2 = client.post("/api/v1/leads", json=lead_payload, headers=owner_auth_headers)
        assert res2.status_code in (201, 400)

        # Activate subscription via API (e.g. upon payment)
        activate_res = client.post(
            "/api/v1/settings/agency/activate-subscription",
            json={
                "plan": "starter",
                "duration_months": 12,
                "payment_method": "IBFT",
                "payment_reference": "MEEZAN-IBFT-948201",
            },
            headers=owner_auth_headers,
        )
        assert activate_res.status_code == 200
        assert activate_res.json()["subscription_status"] == "active"

    finally:
        # Restore agency state
        agency.subscription_status = original_status
        agency.trial_ends_at = original_trial_end
        db_session.commit()
