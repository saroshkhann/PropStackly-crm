from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AgencyBase(BaseModel):
    name: str
    tagline: Optional[str] = None
    ntn_number: Optional[str] = None
    contact_email: str
    contact_phone: str
    whatsapp_business_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = "Islamabad"
    currency_format: Optional[str] = "Crore_Lakh"
    auto_assignment_rule: Optional[str] = "round_robin"
    default_followup_reminder_hours: Optional[str] = "24"
    followup_reminder_minutes_before: Optional[int] = 60
    enable_whatsapp_notifications: Optional[bool] = True
    enable_sms_alerts: Optional[bool] = True
    n8n_webhook_url: Optional[str] = None
    n8n_webhook_secret: Optional[str] = None
    whatsapp_template_name: Optional[str] = "welcome_lead_intro"
    whatsapp_enabled: Optional[bool] = False
    # Subscription & 3-Day Free Trial
    subscription_status: Optional[str] = "trial"  # trial, active, expired, past_due
    subscription_plan: Optional[str] = "starter"  # starter, growth, enterprise
    trial_ends_at: Optional[datetime] = None
    subscription_expires_at: Optional[datetime] = None


class AgencyCreate(AgencyBase):
    pass


class AgencyUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    ntn_number: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    whatsapp_business_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    currency_format: Optional[str] = None
    auto_assignment_rule: Optional[str] = None
    default_followup_reminder_hours: Optional[str] = None
    followup_reminder_minutes_before: Optional[int] = None
    enable_whatsapp_notifications: Optional[bool] = None
    enable_sms_alerts: Optional[bool] = None
    n8n_webhook_url: Optional[str] = None
    n8n_webhook_secret: Optional[str] = None
    whatsapp_template_name: Optional[str] = None
    whatsapp_enabled: Optional[bool] = None
    subscription_status: Optional[str] = None
    subscription_plan: Optional[str] = None
    trial_ends_at: Optional[datetime] = None
    subscription_expires_at: Optional[datetime] = None


class SubscriptionActivateRequest(BaseModel):
    plan: str = "starter"  # starter, growth, enterprise
    duration_months: int = 12
    payment_method: str = "IBFT"  # IBFT, Cash, JazzCash, EasyPaisa, Card
    payment_reference: str = "IBFT-VOUCHER"
    notes: Optional[str] = None


class SubscriptionResetRequest(BaseModel):
    trial_days: int = 3


class AgencyResponse(AgencyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
