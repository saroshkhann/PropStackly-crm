from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class WebhookCallbackPayload(BaseModel):
    event_id: Optional[str] = None
    provider_message_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    lead_id: Optional[str] = None
    status: str  # sent, delivered, read, failed
    recipient_phone: Optional[str] = None
    template_name: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class WebhookEventLogResponse(BaseModel):
    id: str
    agency_id: str
    event_type: str
    status: str
    direction: str
    target_url: Optional[str] = None
    response_status_code: Optional[int] = None
    provider_message_id: Optional[str] = None
    recipient_phone: Optional[str] = None
    template_name: Optional[str] = None
    lead_id: Optional[str] = None
    attempt_count: int
    last_error: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WebhookEventLogListResponse(BaseModel):
    items: List[WebhookEventLogResponse]
    total: int


class N8NTestWebhookRequest(BaseModel):
    webhook_url: Optional[str] = None
    webhook_secret: Optional[str] = None


class N8NTestWebhookResponse(BaseModel):
    success: bool
    status_code: Optional[int] = None
    response_time_ms: float
    message: str
    payload_preview: Dict[str, Any]


class AutomationConfigUpdate(BaseModel):
    n8n_webhook_url: Optional[str] = None
    n8n_webhook_secret: Optional[str] = None
    whatsapp_template_name: Optional[str] = None
    whatsapp_enabled: Optional[bool] = None
    followup_reminder_minutes_before: Optional[int] = Field(None, ge=5, le=1440)


class AutomationConfigResponse(BaseModel):
    n8n_webhook_url: Optional[str] = None
    has_webhook_secret: bool
    whatsapp_template_name: str = "welcome_lead_intro"
    whatsapp_enabled: bool = False
    followup_reminder_minutes_before: int = 60
    official_whatsapp_compliance: Dict[str, Any]


class RunRemindersResponse(BaseModel):
    success: bool
    agencies_processed: int
    upcoming_reminders_sent: int
    overdue_reminders_sent: int
    elapsed_ms: float
    message: str
