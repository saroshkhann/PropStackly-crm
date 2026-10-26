import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Index, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Deal(Base):
    __tablename__ = "deals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agency_id = Column(String(36), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True)
    agent_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    # Pakistani Deal Stages: token, bayana, noc_verification, final_transfer, completed, cancelled
    stage = Column(String(50), default="token", index=True)
    deal_value_pkr = Column(Numeric(18, 2), nullable=False, default=0.0)

    # Stage 1: Token Details
    token_amount_pkr = Column(Numeric(18, 2), nullable=False, default=0.0)
    token_date = Column(String(20), nullable=True)  # YYYY-MM-DD
    token_type = Column(String(50), default="pakka_token")  # kacha_token, pakka_token

    # Stage 2: Bayana Details
    bayana_amount_pkr = Column(Numeric(18, 2), nullable=False, default=0.0)
    bayana_date = Column(String(20), nullable=True)  # YYYY-MM-DD
    iqrarnama_number = Column(String(100), nullable=True)  # Stamp Paper / Legal Agreement Reference

    # Stage 3: NOC & Society Clearance
    noc_authority = Column(String(100), nullable=True)  # DHA Islamabad, Bahria Town, CDA, RDA, LDA
    ndc_cleared = Column(Boolean, default=False, nullable=False)  # No Demand Certificate

    # Stage 4: Transfer & Registry
    transfer_date = Column(String(20), nullable=True)  # YYYY-MM-DD
    registry_number = Column(String(100), nullable=True)

    # Commission Settlement & Split Architecture
    commission_side = Column(String(50), default="both_sides_2pct")  # both_sides_2pct, buyer_side_1pct, seller_side_1pct, custom
    commission_percentage = Column(Numeric(5, 2), default=2.0)
    commission_pkr = Column(Numeric(18, 2), nullable=False, default=0.0)
    agency_split_percentage = Column(Numeric(5, 2), default=50.0)
    agent_split_percentage = Column(Numeric(5, 2), default=50.0)
    agency_commission_pkr = Column(Numeric(18, 2), default=0.0)
    agent_commission_pkr = Column(Numeric(18, 2), default=0.0)
    settlement_status = Column(String(50), default="pending", index=True)  # pending, advance_released, fully_settled

    expected_close_date = Column(String(20), nullable=True)  # YYYY-MM-DD
    closed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=get_utc_now, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="deals")
    lead = relationship("Lead", back_populates="deals")
    property = relationship("Property", back_populates="deals")
    agent = relationship("User", foreign_keys=[agent_id])

    __table_args__ = (
        Index("idx_deal_agency_stage", "agency_id", "stage"),
        Index("idx_deal_agency_created", "agency_id", "created_at"),
        Index("idx_deal_agency_settlement", "agency_id", "settlement_status"),
    )
