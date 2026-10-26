import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Index, Text, Integer, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    city = Column(String(100), default="Islamabad", index=True)
    source = Column(String(100), default="Facebook Ads", index=True)  # Facebook Ads, Zameen.com, WhatsApp, Phone Call, etc.
    status = Column(String(50), default="new", index=True)  # new, contacted, follow_up, site_visit_scheduled, negotiation, won, lost
    priority = Column(String(20), default="high", index=True)  # high, medium, low
    assigned_agent_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    budget_pkr = Column(Numeric(18, 2), nullable=False, default=0.0)  # Numeric/Decimal as required!
    property_type_interest = Column(String(100), default="House / Villa", index=True)
    preferred_locations = Column(String(500), default="DHA Islamabad Phase 2")  # comma-separated or string representation
    purpose = Column(String(100), default="Own Residence")  # Own Residence, Investment, Commercial Rental
    is_archived = Column(Boolean, default=False, nullable=False, index=True)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    updated_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    last_contacted_at = Column(DateTime, nullable=True)
    next_followup_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="leads")
    assigned_agent = relationship("User", back_populates="assigned_leads", foreign_keys=[assigned_agent_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    updated_by = relationship("User", foreign_keys=[updated_by_id])
    activities = relationship("LeadActivity", back_populates="lead", cascade="all, delete-orphan", order_by="desc(LeadActivity.created_at)")
    notes = relationship("LeadNote", back_populates="lead", cascade="all, delete-orphan", order_by="desc(LeadNote.created_at)")
    follow_ups = relationship("FollowUp", back_populates="lead", cascade="all, delete-orphan")
    site_visits = relationship("SiteVisit", back_populates="lead", cascade="all, delete-orphan")
    assignments = relationship("LeadAssignment", back_populates="lead", cascade="all, delete-orphan")
    deals = relationship("Deal", back_populates="lead", cascade="all, delete-orphan")
    associated_properties = relationship("LeadPropertyAssociation", back_populates="lead", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_lead_agency_status", "agency_id", "status"),
        Index("idx_lead_agency_source", "agency_id", "source"),
        Index("idx_lead_agency_created", "agency_id", "created_at"),
    )


class LeadAssignment(Base):
    __tablename__ = "lead_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Relationships
    lead = relationship("Lead", back_populates="assignments")
    agent = relationship("User", foreign_keys=[agent_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])


class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    performed_by_name = Column(String(255), nullable=True)
    type = Column(String(50), nullable=False)  # call, whatsapp, meeting, site_visit, note, status_change
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    # Relationships
    lead = relationship("Lead", back_populates="activities")
    user = relationship("User", back_populates="activities")


class LeadNote(Base):
    __tablename__ = "lead_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author_name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    # Relationships
    lead = relationship("Lead", back_populates="notes")
    user = relationship("User", back_populates="notes")


class LeadPropertyAssociation(Base):
    __tablename__ = "lead_property_associations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    # Relationships
    lead = relationship("Lead", back_populates="associated_properties")
    property = relationship("Property", back_populates="associated_leads")

    __table_args__ = (
        Index("idx_lead_property_assoc", "agency_id", "lead_id", "property_id", unique=True),
    )
