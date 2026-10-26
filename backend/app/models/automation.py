import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class WebhookEventLog(Base):
    __tablename__ = "webhook_event_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)  # lead.created, lead.assigned, whatsapp.template_dispatched, whatsapp.status_callback
    status = Column(String(50), nullable=False, default="pending", index=True)  # pending, delivered, confirmed, failed, skipped
    direction = Column(String(20), nullable=False, default="outbound")  # outbound (to n8n), inbound (from n8n/provider)
    payload = Column(Text, nullable=False)
    target_url = Column(String(500), nullable=True)
    response_status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    provider_message_id = Column(String(255), nullable=True, index=True)  # e.g., wamid.HBg...
    recipient_phone = Column(String(50), nullable=True, index=True)
    template_name = Column(String(100), nullable=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    attempt_count = Column(Integer, default=0, nullable=False)
    last_error = Column(Text, nullable=True)
    idempotency_key = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    confirmed_at = Column(DateTime, nullable=True)

    # Relationships
    agency = relationship("Agency")
    lead = relationship("Lead")

    __table_args__ = (
        Index("idx_webhook_agency_status", "agency_id", "status"),
        Index("idx_webhook_agency_event", "agency_id", "event_type"),
        Index("idx_webhook_idempotency", "agency_id", "idempotency_key"),
        Index("idx_webhook_created_at", "agency_id", "created_at"),
    )
