import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Index, Text, Integer, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Property(Base):
    __tablename__ = "properties"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False, index=True)  # Residential Plot, House / Villa, Commercial Plaza, etc.
    city = Column(String(100), default="Islamabad", index=True)
    location = Column(String(255), nullable=False)
    society = Column(String(255), nullable=False, index=True)
    price_pkr = Column(Numeric(18, 2), nullable=False, default=0.0)  # Numeric/Decimal as required!
    area_size = Column(String(100), nullable=False)  # 10 Marla, 1 Kanal, etc.
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    status = Column(String(50), default="available", index=True)  # available, under_negotiation, sold, reserved
    featured = Column(Boolean, default=False)
    image_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    video_url = Column(String(500), nullable=True)
    noc_status = Column(String(100), nullable=True, default="CDA / RDA Approved")
    documents_verified = Column(Boolean, default=True, nullable=False)
    allotment_status = Column(String(100), nullable=True, default="Direct Transfer Ready")
    possession_status = Column(String(100), nullable=True, default="Immediate Possession Available")
    gallery_images = Column(Text, nullable=True)
    assigned_agent_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="properties")
    assigned_agent = relationship("User", back_populates="assigned_properties", foreign_keys=[assigned_agent_id])
    site_visits = relationship("SiteVisit", back_populates="property", cascade="all, delete-orphan")
    deals = relationship("Deal", back_populates="property")
    associated_leads = relationship("LeadPropertyAssociation", back_populates="property", cascade="all, delete-orphan")
    share_links = relationship("PropertyShareLink", back_populates="property", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_property_agency_status", "agency_id", "status"),
        Index("idx_property_agency_type", "agency_id", "type"),
        Index("idx_property_agency_society", "agency_id", "society"),
    )
