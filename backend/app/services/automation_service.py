import hmac
import hashlib
import json
import logging
import time
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timezone
import httpx
from sqlalchemy.orm import Session

from app.models.agency import Agency
from app.models.lead import Lead, LeadActivity
from app.models.automation import WebhookEventLog
from app.services.notification_service import NotificationService
from app.schemas.automation import WebhookCallbackPayload

logger = logging.getLogger("propstackly.automation")


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AutomationService:
    @staticmethod
    def compute_hmac_signature(secret: str, payload_bytes: bytes) -> str:
        """Computes HMAC-SHA256 signature for webhook payload verification."""
        digest = hmac.new(
            secret.encode("utf-8"),
            payload_bytes,
            hashlib.sha256,
        ).hexdigest()
        return f"sha256={digest}"

    @staticmethod
    def verify_hmac_signature(secret: str, payload_bytes: bytes, signature_header: Optional[str]) -> bool:
        """Verifies that an incoming webhook signature matches the expected HMAC-SHA256."""
        if not signature_header or not secret:
            return False
        expected = AutomationService.compute_hmac_signature(secret, payload_bytes)
        # Support both 'sha256=<hex>' and raw '<hex>'
        raw_sig = signature_header if signature_header.startswith("sha256=") else f"sha256={signature_header}"
        return hmac.compare_digest(expected, raw_sig)

    @staticmethod
    def trigger_lead_created_workflow(
        db: Session,
        agency: Agency,
        lead: Lead,
    ) -> Optional[WebhookEventLog]:
        """
        Triggers an outbound webhook to n8n when a new lead is created.
        Features:
        - Strict opt-in: Skips if whatsapp_enabled is False.
        - Idempotency: Prevents duplicate triggers for the same lead.
        - HMAC signing: Protects payload integrity with agency webhook secret.
        - Resilient: Retries on network timeout; does NOT fail core lead creation on error.
        - Truth-in-messaging: Marks status as 'delivered' to webhook queue, NOT 'confirmed' (sent).
        """
        webhook_url = agency.n8n_webhook_url
        if not webhook_url:
            logger.debug("n8n webhook URL not configured for agency_id=%s. Skipping.", agency.id)
            return None

        # Guard against unsolicited messages: Check if WhatsApp automation is enabled
        if not agency.whatsapp_enabled:
            logger.info(
                "WhatsApp messaging disabled for agency_id=%s. Skipping outbound trigger for lead_id=%s.",
                agency.id,
                lead.id,
            )
            return None

        idempotency_key = f"lead_created_{lead.id}"

        # Deduplication check
        existing_log = (
            db.query(WebhookEventLog)
            .filter(
                WebhookEventLog.agency_id == agency.id,
                WebhookEventLog.idempotency_key == idempotency_key,
                WebhookEventLog.status.in_(["delivered", "confirmed"]),
            )
            .first()
        )
        if existing_log:
            logger.info(
                "Skipping duplicate lead webhook trigger: idempotency_key=%s, status=%s",
                idempotency_key,
                existing_log.status,
            )
            return existing_log

        # Construct official-compliant WhatsApp template payload
        template_name = agency.whatsapp_template_name or "welcome_lead_intro"
        agent_name = lead.assigned_agent.full_name if lead.assigned_agent else agency.name

        event_payload = {
            "event_id": f"evt_{lead.id}",
            "event_type": "lead.created",
            "agency_id": agency.id,
            "timestamp": get_utc_now().isoformat(),
            "lead": {
                "id": lead.id,
                "full_name": lead.full_name,
                "phone": lead.phone,
                "city": lead.city,
                "source": lead.source,
                "property_type": lead.property_type_interest,
                "budget_pkr": float(lead.budget_pkr) if lead.budget_pkr else 0.0,
                "preferred_locations": lead.preferred_locations,
                "assigned_agent_name": agent_name,
            },
            "whatsapp_config": {
                "template_name": template_name,
                "recipient_phone": lead.phone,
                "language": "en_US",
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": lead.full_name},
                            {"type": "text", "text": agency.name},
                            {"type": "text", "text": agent_name},
                            {"type": "text", "text": lead.property_type_interest or "property"},
                        ],
                    }
                ],
            },
        }

        payload_json = json.dumps(event_payload, separators=(",", ":"))
        payload_bytes = payload_json.encode("utf-8")

        # Record event log entry in database as pending
        log_entry = WebhookEventLog(
            agency_id=agency.id,
            lead_id=lead.id,
            event_type="lead.created",
            status="pending",
            direction="outbound",
            target_url=webhook_url,
            recipient_phone=lead.phone,
            template_name=template_name,
            idempotency_key=idempotency_key,
            payload=payload_json,
            attempt_count=1,
            created_at=get_utc_now(),
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)

        headers = {
            "Content-Type": "application/json",
            "X-PropStackly-Event": "lead.created",
            "X-PropStackly-Agency-Id": agency.id,
            "X-PropStackly-Event-Id": log_entry.id,
            "X-Veltrivo-Event": "lead.created",
            "X-Veltrivo-Agency-Id": agency.id,
            "X-Veltrivo-Event-Id": log_entry.id,
        }
        if agency.n8n_webhook_secret:
            sig = AutomationService.compute_hmac_signature(
                agency.n8n_webhook_secret,
                payload_bytes,
            )
            headers["X-PropStackly-Signature"] = sig
            headers["X-Veltrivo-Signature"] = sig

        # Execute dispatch with retry & timeout protection
        max_retries = 2
        last_error_str = None
        for attempt in range(1, max_retries + 1):
            log_entry.attempt_count = attempt
            try:
                with httpx.Client(timeout=8.0) as client:
                    resp = client.post(webhook_url, content=payload_bytes, headers=headers)
                    log_entry.response_status_code = resp.status_code
                    log_entry.response_body = resp.text[:1000]

                    if 200 <= resp.status_code < 300:
                        # Successfully accepted by n8n workflow
                        # NOTE: Status is 'delivered' to workflow queue, awaiting provider delivery confirmation
                        log_entry.status = "delivered"
                        db.commit()
                        logger.info(
                            "Outbound webhook delivered to n8n: lead_id=%s, url=%s, status=%d",
                            lead.id,
                            webhook_url,
                            resp.status_code,
                        )
                        return log_entry
                    else:
                        last_error_str = f"HTTP {resp.status_code}: {resp.text[:200]}"
                        logger.warning(
                            "n8n webhook attempt %d/%d rejected: %s",
                            attempt,
                            max_retries,
                            last_error_str,
                        )
            except httpx.RequestError as exc:
                last_error_str = f"Network error: {str(exc)}"
                logger.warning(
                    "n8n webhook attempt %d/%d failed with exception: %s",
                    attempt,
                    max_retries,
                    last_error_str,
                )
            except Exception as exc:
                last_error_str = f"Unexpected error: {str(exc)}"
                logger.error("n8n webhook unexpected error: %s", last_error_str, exc_info=True)
                break

            if attempt < max_retries:
                time.sleep(0.5 * attempt)

        # If all retries failed
        log_entry.status = "failed"
        log_entry.last_error = last_error_str
        db.commit()
        logger.error(
            "n8n webhook dispatch permanently failed for lead_id=%s: %s",
            lead.id,
            last_error_str,
        )
        return log_entry

    @staticmethod
    def handle_provider_callback(
        db: Session,
        agency: Agency,
        payload: WebhookCallbackPayload,
        raw_body: bytes,
        signature_header: Optional[str] = None,
    ) -> Tuple[bool, str, Optional[WebhookEventLog]]:
        """
        Processes incoming status callbacks from n8n / WhatsApp Business Platform.
        Only marks message as confirmed/sent when provider explicitly confirms delivery.
        """
        # Validate signature if agency configured a webhook secret
        if agency.n8n_webhook_secret:
            if not AutomationService.verify_hmac_signature(agency.n8n_webhook_secret, raw_body, signature_header):
                logger.warning(
                    "Rejected unauthorized callback for agency_id=%s: HMAC signature mismatch",
                    agency.id,
                )
                return False, "Invalid HMAC signature header", None

        # Match existing event log
        query = db.query(WebhookEventLog).filter(WebhookEventLog.agency_id == agency.id)

        target_log = None
        if payload.event_id:
            target_log = query.filter(WebhookEventLog.id == payload.event_id).first()
        if not target_log and payload.idempotency_key:
            target_log = query.filter(WebhookEventLog.idempotency_key == payload.idempotency_key).first()
        if not target_log and payload.provider_message_id:
            target_log = query.filter(WebhookEventLog.provider_message_id == payload.provider_message_id).first()
        if not target_log and payload.lead_id:
            target_log = (
                query.filter(WebhookEventLog.lead_id == payload.lead_id)
                .order_by(WebhookEventLog.created_at.desc())
                .first()
            )

        # If no previous outbound log exists, create an inbound log entry
        if not target_log:
            target_log = WebhookEventLog(
                agency_id=agency.id,
                lead_id=payload.lead_id,
                event_type="whatsapp.status_callback",
                status="pending",
                direction="inbound",
                payload=raw_body.decode("utf-8", errors="replace"),
                recipient_phone=payload.recipient_phone,
                provider_message_id=payload.provider_message_id,
                template_name=payload.template_name,
                created_at=get_utc_now(),
            )
            db.add(target_log)
            db.flush()

        # Update log based on provider status
        normalized_status = payload.status.lower()

        if normalized_status in ["sent", "delivered", "read"]:
            # Provider confirmed success!
            target_log.status = "confirmed"
            target_log.confirmed_at = get_utc_now()
            if payload.provider_message_id:
                target_log.provider_message_id = payload.provider_message_id

            # Add Lead Activity if lead is linked
            if target_log.lead_id:
                lead = db.query(Lead).filter(Lead.id == target_log.lead_id).first()
                if lead:
                    msg_id_info = f" (WAMID: {payload.provider_message_id})" if payload.provider_message_id else ""
                    activity = LeadActivity(
                        agency_id=agency.id,
                        lead_id=lead.id,
                        type="whatsapp",
                        title="WhatsApp Template Delivered",
                        description=(
                            f"Approved template '{target_log.template_name or 'welcome_lead_intro'}' "
                            f"confirmed delivered to {lead.phone}{msg_id_info}."
                        ),
                        created_at=get_utc_now(),
                    )
                    db.add(activity)

                    # Notify assigned agent of delivery confirmation
                    if lead.assigned_agent_id:
                        NotificationService.create_notification(
                            db=db,
                            agency_id=agency.id,
                            user_id=lead.assigned_agent_id,
                            title=f"WhatsApp Delivered: {lead.full_name}",
                            message=f"WhatsApp intro confirmed delivered to {lead.phone}.",
                            type="whatsapp_sent",
                            priority="normal",
                            link_url=f"/leads/{lead.id}",
                            entity_type="lead",
                            entity_id=lead.id,
                            deduplication_key=f"whatsapp_confirmed_{target_log.id}",
                        )

            db.commit()
            db.refresh(target_log)
            logger.info(
                "WhatsApp message confirmed by provider: log_id=%s, wamid=%s",
                target_log.id,
                payload.provider_message_id,
            )
            return True, "Provider delivery confirmed", target_log

        elif normalized_status in ["failed", "undelivered", "rejected"]:
            target_log.status = "failed"
            target_log.last_error = payload.error_message or "Provider rejected message"

            if target_log.lead_id:
                lead = db.query(Lead).filter(Lead.id == target_log.lead_id).first()
                if lead:
                    activity = LeadActivity(
                        agency_id=agency.id,
                        lead_id=lead.id,
                        type="whatsapp",
                        title="WhatsApp Delivery Failed",
                        description=f"Provider reported failure: {target_log.last_error}",
                        created_at=get_utc_now(),
                    )
                    db.add(activity)

                    if lead.assigned_agent_id:
                        NotificationService.create_notification(
                            db=db,
                            agency_id=agency.id,
                            user_id=lead.assigned_agent_id,
                            title=f"WhatsApp Failed: {lead.full_name}",
                            message=f"Could not deliver WhatsApp to {lead.phone}: {target_log.last_error}",
                            type="whatsapp_failed",
                            priority="high",
                            link_url=f"/leads/{lead.id}",
                            entity_type="lead",
                            entity_id=lead.id,
                            deduplication_key=f"whatsapp_failed_{target_log.id}",
                        )

            db.commit()
            db.refresh(target_log)
            logger.warning(
                "WhatsApp message failed at provider: log_id=%s, error=%s",
                target_log.id,
                target_log.last_error,
            )
            return True, f"Failure recorded: {target_log.last_error}", target_log

        else:
            db.commit()
            return True, f"Status '{payload.status}' acknowledged", target_log

    @staticmethod
    def test_n8n_webhook(
        agency: Agency,
        webhook_url: Optional[str] = None,
        webhook_secret: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Sends a test ping event to the provided or agency-configured n8n webhook URL.
        Measures response latency and verifies HTTP status code.
        """
        target_url = webhook_url or agency.n8n_webhook_url
        if not target_url:
            return {
                "success": False,
                "status_code": None,
                "response_time_ms": 0.0,
                "message": "No webhook URL configured or provided.",
                "payload_preview": {},
            }

        secret = webhook_secret or agency.n8n_webhook_secret

        test_payload = {
            "event_type": "propstackly.test_ping",
            "agency_id": agency.id,
            "agency_name": agency.name,
            "timestamp": get_utc_now().isoformat(),
            "simulation": True,
            "message": "PropStackly CRM n8n connectivity verification ping.",
        }

        payload_json = json.dumps(test_payload, separators=(",", ":"))
        payload_bytes = payload_json.encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "X-PropStackly-Event": "propstackly.test_ping",
            "X-PropStackly-Agency-Id": agency.id,
            "X-Veltrivo-Event": "propstackly.test_ping",
            "X-Veltrivo-Agency-Id": agency.id,
        }
        if secret:
            sig = AutomationService.compute_hmac_signature(
                secret,
                payload_bytes,
            )
            headers["X-PropStackly-Signature"] = sig
            headers["X-Veltrivo-Signature"] = sig

        start_time = time.perf_counter()
        try:
            with httpx.Client(timeout=6.0) as client:
                resp = client.post(target_url, content=payload_bytes, headers=headers)
                latency = round((time.perf_counter() - start_time) * 1000, 2)
                success = 200 <= resp.status_code < 300
                msg = f"HTTP {resp.status_code} - {resp.reason_phrase}" if success else f"Received HTTP {resp.status_code}"
                return {
                    "success": success,
                    "status_code": resp.status_code,
                    "response_time_ms": latency,
                    "message": msg,
                    "payload_preview": test_payload,
                }
        except httpx.TimeoutException:
            latency = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": False,
                "status_code": None,
                "response_time_ms": latency,
                "message": "Connection timed out after 6.0 seconds.",
                "payload_preview": test_payload,
            }
        except Exception as exc:
            latency = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "success": False,
                "status_code": None,
                "response_time_ms": latency,
                "message": f"Connection error: {str(exc)}",
                "payload_preview": test_payload,
            }
