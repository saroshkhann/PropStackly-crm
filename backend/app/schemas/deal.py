from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class DealBase(BaseModel):
    lead_id: str
    property_id: Optional[str] = None
    agent_id: Optional[str] = None
    title: str
    # Stages: token, bayana, noc_verification, final_transfer, completed, cancelled
    stage: str = "token"
    deal_value_pkr: Decimal = Decimal("0.00")

    # Stage 1: Token Details (Kacha / Pakka)
    token_amount_pkr: Decimal = Decimal("0.00")
    token_date: Optional[str] = None
    token_type: Optional[str] = "pakka_token"  # kacha_token, pakka_token

    # Stage 2: Bayana Details (Iqrarnama)
    bayana_amount_pkr: Decimal = Decimal("0.00")
    bayana_date: Optional[str] = None
    iqrarnama_number: Optional[str] = None

    # Stage 3: NOC & Society Clearance (NDC)
    noc_authority: Optional[str] = None
    ndc_cleared: bool = False

    # Stage 4: Transfer & Registry
    transfer_date: Optional[str] = None
    registry_number: Optional[str] = None

    # Commission Settlement
    commission_side: str = "both_sides_2pct"  # both_sides_2pct, buyer_side_1pct, seller_side_1pct, custom
    commission_percentage: Decimal = Decimal("2.00")
    commission_pkr: Decimal = Decimal("0.00")
    agency_split_percentage: Decimal = Decimal("50.00")
    agent_split_percentage: Decimal = Decimal("50.00")
    agency_commission_pkr: Decimal = Decimal("0.00")
    agent_commission_pkr: Decimal = Decimal("0.00")
    settlement_status: str = "pending"  # pending, advance_released, fully_settled

    expected_close_date: Optional[str] = None
    notes: Optional[str] = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    property_id: Optional[str] = None
    agent_id: Optional[str] = None
    title: Optional[str] = None
    stage: Optional[str] = None
    deal_value_pkr: Optional[Decimal] = None

    token_amount_pkr: Optional[Decimal] = None
    token_date: Optional[str] = None
    token_type: Optional[str] = None

    bayana_amount_pkr: Optional[Decimal] = None
    bayana_date: Optional[str] = None
    iqrarnama_number: Optional[str] = None

    noc_authority: Optional[str] = None
    ndc_cleared: Optional[bool] = None

    transfer_date: Optional[str] = None
    registry_number: Optional[str] = None

    commission_side: Optional[str] = None
    commission_percentage: Optional[Decimal] = None
    commission_pkr: Optional[Decimal] = None
    agency_split_percentage: Optional[Decimal] = None
    agent_split_percentage: Optional[Decimal] = None
    agency_commission_pkr: Optional[Decimal] = None
    agent_commission_pkr: Optional[Decimal] = None
    settlement_status: Optional[str] = None

    expected_close_date: Optional[str] = None
    notes: Optional[str] = None


class DealResponse(DealBase):
    id: str
    agency_id: str
    lead_name: Optional[str] = None
    lead_phone: Optional[str] = None
    property_title: Optional[str] = None
    property_location: Optional[str] = None
    agent_name: Optional[str] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommissionCalculatorRequest(BaseModel):
    deal_value_pkr: Decimal = Field(..., description="Property transaction price in PKR")
    commission_side: str = Field(
        default="both_sides_2pct",
        description="both_sides_2pct (2%), buyer_side_1pct (1%), seller_side_1pct (1%), or custom",
    )
    custom_commission_percentage: Optional[Decimal] = Field(
        default=None, description="Custom commission percentage if commission_side is 'custom'"
    )
    agency_split_percentage: Decimal = Field(
        default=Decimal("50.0"), description="Agency commission percentage share"
    )
    agent_split_percentage: Decimal = Field(
        default=Decimal("50.0"), description="Agent commission percentage share"
    )


class CommissionCalculatorResponse(BaseModel):
    deal_value_pkr: Decimal
    commission_side: str
    commission_percentage: Decimal
    total_commission_pkr: Decimal
    agency_commission_pkr: Decimal
    agent_commission_pkr: Decimal
    formatted_deal_value: str
    formatted_total_commission: str
    formatted_agency_commission: str
    formatted_agent_commission: str
