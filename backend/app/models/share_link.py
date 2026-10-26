import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Text, Integer, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PropertyShareLink(Base):
    __tablename__ = "property_share_links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)

    token = Column(String(64), unique=True, nullable=False, index=True)
    target_buyer_name = Column(String(255), nullable=True)
    target_buyer_country = Column(String(100), nullable=True)  # UK, UAE, USA, Saudi Arabia, Canada
    target_buyer_city = Column(String(100), nullable=True)     # London, Dubai, Riyadh, New York
    target_buyer_phone = Column(String(50), nullable=True)
    custom_pitch = Column(Text, nullable=True)
    default_currency = Column(String(10), default="GBP")      # GBP, AED, USD, SAR, PKR

    views_count = Column(Integer, default=0, nullable=False)
    last_viewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    agency = relationship("Agency")
    property = relationship("Property", back_populates="share_links")
    agent = relationship("User")
    lead = relationship("Lead")

    __table_args__ = (
        Index("idx_sharelink_agency_token", "agency_id", "token"),
        Index("idx_sharelink_property", "property_id"),
    )
