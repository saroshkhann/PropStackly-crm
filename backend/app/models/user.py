import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, Numeric, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    role_title = Column(String(100), default="Property Consultant")
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    monthly_target_pkr = Column(Numeric(18, 2), default=80000000.0, nullable=True)
    token_version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    memberships = relationship("AgencyMembership", back_populates="user", cascade="all, delete-orphan")
    assigned_leads = relationship("Lead", back_populates="assigned_agent", foreign_keys="Lead.assigned_agent_id")
    assigned_properties = relationship("Property", back_populates="assigned_agent", foreign_keys="Property.assigned_agent_id")
    assigned_followups = relationship("FollowUp", back_populates="assigned_agent", foreign_keys="FollowUp.assigned_agent_id")
    assigned_site_visits = relationship("SiteVisit", back_populates="assigned_agent", foreign_keys="SiteVisit.assigned_agent_id")
    activities = relationship("LeadActivity", back_populates="user")
    notes = relationship("LeadNote", back_populates="user")
