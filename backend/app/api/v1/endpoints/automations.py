from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import (
    get_db,
    get_tenant_context,
    require_manager,
    require_owner,
    TenantContext,
)
from app.models.agency import Agency
from app.models.automation import WebhookEventLog
from app.services.automation_service import AutomationService
from app.services.scheduler import run_followup_reminders_job
from app.schemas.automation import (
    WebhookCallbackPayload,
    WebhookEventLogResponse,
    WebhookEventLogListResponse,
    N8NTestWebhookRequest,
    N8NTestWebhookResponse,
    AutomationConfigUpdate,
    AutomationConfigResponse,
    RunRemindersResponse,
)

router = APIRouter()


def _get_official_whatsapp_compliance() -> dict:
    """Returns official WhatsApp Business Platform readiness metadata."""
    return {
        "provider": "Meta WhatsApp Business Cloud API / On-Premises via n8n",
        "documentation_path": "backend/docs/WHATSAPP_N8N_INTEGRATION.md",
        "compliance_notes": [
            "Opt-in Consent: Explicit consent required prior to dispatching outbound messages.",
            "Pre-approved Templates: Business-initiated conversations outside 24h window require Meta approval.",
            "Provider Confirmation: Status only moves to 'confirmed' upon delivery receipt callback.",
            "PTA / Local Regulations: Marketing bulk messaging strictly restricted to verified opt-in numbers.",
        ],
        "supported_templates": [
            {
                "name": "welcome_lead_intro",
                "category": "UTILITY",
                "status": "APPROVED",
                "body": "Assalam-o-Alaikum {{1}}! Thank you for your inquiry with {{2}}. Your dedicated property consultant {{3}} will assist you regarding {{4}}.",
            },
            {
                "name": "site_visit_reminder_2h",
                "category": "UTILITY",
                "status": "APPROVED",
                "body": "Dear {{1}}, your site tour for {{2}} is confirmed for {{3}} at {{4}}. Guide: {{5}} ({{6}}).",
            },
        ],
    }


@router.post("/run-reminders", response_model=RunRemindersResponse)
def trigger_scheduled_reminders(
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """
    Manually triggers the follow-up reminder job.
    Accessible to Agency Owners and Managers. Useful for immediate testing or cron verification.
    """
    result = run_followup_reminders_job(db=db)
    return RunRemindersResponse(
        success=result["success"],
        agencies_processed=result["agencies_processed"],
        upcoming_reminders_sent=result["upcoming_reminders_sent"],
        overdue_reminders_sent=result["overdue_reminders_sent"],
        elapsed_ms=result["elapsed_ms"],
        message=result["message"],
    )


@router.get("/config", response_model=AutomationConfigResponse)
def get_automation_config(
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """
    Returns the agency's automation and webhook configuration.
    Secrets are never exposed in plain text.
    """
    agency = db.query(Agency).filter(Agency.id == tenant.agency_id).first()
    if not agency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agency not found")

    return AutomationConfigResponse(
        n8n_webhook_url=agency.n8n_webhook_url,
        has_webhook_secret=bool(agency.n8n_webhook_secret),
        whatsapp_template_name=agency.whatsapp_template_name or "welcome_lead_intro",
        whatsapp_enabled=bool(agency.whatsapp_enabled),
        followup_reminder_minutes_before=agency.followup_reminder_minutes_before or 60,
        official_whatsapp_compliance=_get_official_whatsapp_compliance(),
    )


@router.patch("/config", response_model=AutomationConfigResponse)
def update_automation_config(
    data: AutomationConfigUpdate,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """
    Update automation and webhook settings. Only agency owners can update configuration.
    """
    agency = db.query(Agency).filter(Agency.id == tenant.agency_id).first()
    if not agency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agency not found")

    if data.n8n_webhook_url is not None:
        agency.n8n_webhook_url = data.n8n_webhook_url.strip() or None
    if data.n8n_webhook_secret is not None:
        agency.n8n_webhook_secret = data.n8n_webhook_secret.strip() or None
    if data.whatsapp_template_name is not None:
        agency.whatsapp_template_name = data.whatsapp_template_name.strip()
    if data.whatsapp_enabled is not None:
        agency.whatsapp_enabled = data.whatsapp_enabled
    if data.followup_reminder_minutes_before is not None:
        agency.followup_reminder_minutes_before = data.followup_reminder_minutes_before

    db.commit()
    db.refresh(agency)

    return AutomationConfigResponse(
        n8n_webhook_url=agency.n8n_webhook_url,
        has_webhook_secret=bool(agency.n8n_webhook_secret),
        whatsapp_template_name=agency.whatsapp_template_name or "welcome_lead_intro",
        whatsapp_enabled=bool(agency.whatsapp_enabled),
        followup_reminder_minutes_before=agency.followup_reminder_minutes_before or 60,
        official_whatsapp_compliance=_get_official_whatsapp_compliance(),
    )


@router.post("/test-n8n-webhook", response_model=N8NTestWebhookResponse)
def test_n8n_webhook(
    req: N8NTestWebhookRequest,
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """
    Sends a test ping to the specified or stored n8n webhook URL to verify connectivity.
    """
    agency = db.query(Agency).filter(Agency.id == tenant.agency_id).first()
    if not agency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agency not found")

    result = AutomationService.test_n8n_webhook(
        agency=agency,
        webhook_url=req.webhook_url,
        webhook_secret=req.webhook_secret,
    )
    return N8NTestWebhookResponse(
        success=result["success"],
        status_code=result["status_code"],
        response_time_ms=result["response_time_ms"],
        message=result["message"],
        payload_preview=result["payload_preview"],
    )


@router.get("/logs", response_model=WebhookEventLogListResponse)
def get_webhook_logs(
    status_filter: Optional[str] = Query(None, alias="status"),
    event_type: Optional[str] = None,
    lead_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """
    Lists audit logs of outbound triggers and inbound delivery callbacks.
    Strictly isolated to the authenticated user's agency.
    """
    query = db.query(WebhookEventLog).filter(WebhookEventLog.agency_id == tenant.agency_id)

    if status_filter:
        query = query.filter(WebhookEventLog.status == status_filter)
    if event_type:
        query = query.filter(WebhookEventLog.event_type == event_type)
    if lead_id:
        query = query.filter(WebhookEventLog.lead_id == lead_id)

    total = query.count()
    items = query.order_by(desc(WebhookEventLog.created_at)).offset(offset).limit(limit).all()

    return WebhookEventLogListResponse(
        items=[WebhookEventLogResponse.model_validate(item) for item in items],
        total=total,
    )


@router.post("/webhooks/n8n/callback")
async def handle_n8n_callback(
    request: Request,
    payload: WebhookCallbackPayload,
    agency_id: Optional[str] = Query(None),
    x_propstackly_agency_id: Optional[str] = Header(None),
    x_veltrivo_agency_id: Optional[str] = Header(None),
    x_propstackly_signature: Optional[str] = Header(None),
    x_veltrivo_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Inbound webhook endpoint for n8n or WhatsApp providers to report delivery confirmations or failures.
    Secured with HMAC signature verification using the agency's webhook secret.
    """
    target_agency_id = x_propstackly_agency_id or x_veltrivo_agency_id or agency_id
    if not target_agency_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agency identifier missing in request headers or query params",
        )

    agency = db.query(Agency).filter(Agency.id == target_agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target agency not found",
        )

    raw_body = await request.body()

    signature_header = x_propstackly_signature or x_veltrivo_signature
    success, msg, log_entry = AutomationService.handle_provider_callback(
        db=db,
        agency=agency,
        payload=payload,
        raw_body=raw_body,
        signature_header=signature_header,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=msg,
        )

    return {
        "success": True,
        "message": msg,
        "event_log_id": log_entry.id if log_entry else None,
        "confirmed": log_entry.status == "confirmed" if log_entry else False,
    }
