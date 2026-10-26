import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, default="system")  # lead_assigned, followup_upcoming, followup_overdue, whatsapp_sent, system
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    link_url = Column(String(255), nullable=True)
    entity_type = Column(String(50), nullable=True)  # lead, follow_up, site_visit, webhook
    entity_id = Column(String(36), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
    deduplication_key = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)

    # Relationships
    agency = relationship("Agency")
    user = relationship("User")

    __table_args__ = (
        Index("idx_notification_agency_user_read", "agency_id", "user_id", "is_read"),
        Index("idx_notification_agency_dedup", "agency_id", "deduplication_key"),
        Index("idx_notification_created_at", "agency_id", "created_at"),
    )
