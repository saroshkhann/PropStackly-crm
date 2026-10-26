import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_agent_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    scheduled_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    scheduled_time = Column(String(20), nullable=False)  # HH:MM
    type = Column(String(50), nullable=False, default="Phone Call")  # Phone Call, WhatsApp Message, In-Person Meeting, Documentation
    notes = Column(Text, nullable=False)
    priority = Column(String(20), default="high")
    completed = Column(Boolean, default=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    completed_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="follow_ups")
    lead = relationship("Lead", back_populates="follow_ups")
    assigned_agent = relationship("User", back_populates="assigned_followups", foreign_keys=[assigned_agent_id])
    completed_by = relationship("User", foreign_keys=[completed_by_id])

    __table_args__ = (
        Index("idx_followup_agency_date", "agency_id", "scheduled_date"),
        Index("idx_followup_agency_completed", "agency_id", "completed"),
    )


class SiteVisit(Base):
    __tablename__ = "site_visits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_agent_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    visit_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    visit_time = Column(String(20), nullable=False)  # HH:MM
    status = Column(String(50), default="scheduled", index=True)  # scheduled, completed_interested, completed_not_interested, cancelled, rescheduled
    is_virtual = Column(Boolean, default=False, nullable=False)
    meeting_platform = Column(String(50), default="in_person", nullable=False)  # whatsapp_video, zoom, google_meet, in_person
    client_timezone = Column(String(50), default="Asia/Karachi", nullable=False)  # Europe/London, Asia/Dubai, etc.
    client_local_time = Column(String(50), nullable=True)  # e.g. "04:00 PM BST"
    notes = Column(Text, nullable=True)
    client_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="site_visits")
    lead = relationship("Lead", back_populates="site_visits")
    property = relationship("Property", back_populates="site_visits")
    assigned_agent = relationship("User", back_populates="assigned_site_visits", foreign_keys=[assigned_agent_id])

    __table_args__ = (
        Index("idx_sitevisit_agency_date", "agency_id", "visit_date"),
        Index("idx_sitevisit_agency_status", "agency_id", "status"),
    )
