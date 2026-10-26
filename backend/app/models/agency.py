import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_default_trial_ends_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=3)


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    tagline = Column(String(255), nullable=True)
    ntn_number = Column(String(50), nullable=True, index=True)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    whatsapp_business_phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=False, default="Islamabad", index=True)
    currency_format = Column(String(50), default="Crore_Lakh")
    auto_assignment_rule = Column(String(50), default="round_robin")
    default_followup_reminder_hours = Column(String(20), default="24")
    followup_reminder_minutes_before = Column(Integer, default=60)
    enable_whatsapp_notifications = Column(Boolean, default=True)
    enable_sms_alerts = Column(Boolean, default=True)
    # n8n & WhatsApp Automation Config
    n8n_webhook_url = Column(String(500), nullable=True)
    n8n_webhook_secret = Column(String(255), nullable=True)
    whatsapp_template_name = Column(String(100), default="welcome_lead_intro")
    whatsapp_enabled = Column(Boolean, default=False)

    # 3-Day Free Trial & Subscription Licensing
    subscription_status = Column(String(50), default="trial", nullable=False)  # trial, active, expired, past_due
    subscription_plan = Column(String(50), default="starter", nullable=False)  # starter, growth, enterprise
    trial_ends_at = Column(DateTime, default=get_default_trial_ends_at, nullable=True)
    subscription_expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    memberships = relationship("AgencyMembership", back_populates="agency", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="agency", cascade="all, delete-orphan")
    properties = relationship("Property", back_populates="agency", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="agency", cascade="all, delete-orphan")
    site_visits = relationship("SiteVisit", back_populates="agency", cascade="all, delete-orphan")
    deals = relationship("Deal", back_populates="agency", cascade="all, delete-orphan")


class AgencyMembership(Base):
    __tablename__ = "agency_memberships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="agent")  # "admin", "broker", "agent"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="memberships")
    user = relationship("User", back_populates="memberships")

    __table_args__ = (
        Index("idx_agency_user", "agency_id", "user_id", unique=True),
    )
