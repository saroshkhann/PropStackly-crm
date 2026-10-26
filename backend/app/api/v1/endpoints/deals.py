from typing import Any, List, Optional
from decimal import Decimal
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.api.deps import (
    get_db,
    get_tenant_context,
    require_active_subscription,
    TenantContext,
)
from app.models.lead import Lead, LeadActivity
from app.models.property import Property
from app.models.deal import Deal
from app.schemas.deal import (
    DealCreate,
    DealUpdate,
    DealResponse,
    CommissionCalculatorRequest,
    CommissionCalculatorResponse,
)
from app.services.matching_service import format_pkr_crore_lakh

router = APIRouter()


def compute_commission_splits(
    deal_value: Decimal,
    commission_side: str,
    custom_percentage: Optional[Decimal],
    agency_split_pct: Decimal,
    agent_split_pct: Decimal,
) -> tuple[Decimal, Decimal, Decimal, Decimal]:
    """
    Returns (effective_percentage, total_commission_pkr, agency_commission_pkr, agent_commission_pkr)
    """
    if commission_side == "both_sides_2pct":
        effective_pct = Decimal("2.00")
    elif commission_side in ("buyer_side_1pct", "seller_side_1pct"):
        effective_pct = Decimal("1.00")
    elif commission_side == "custom" and custom_percentage is not None:
        effective_pct = custom_percentage
    else:
        effective_pct = Decimal("2.00")

    total_commission = (deal_value * (effective_pct / Decimal("100.0"))).quantize(Decimal("0.01"))
    agency_cut = (total_commission * (agency_split_pct / Decimal("100.0"))).quantize(Decimal("0.01"))
    agent_cut = (total_commission * (agent_split_pct / Decimal("100.0"))).quantize(Decimal("0.01"))

    return effective_pct, total_commission, agency_cut, agent_cut


def serialize_deal(deal: Deal) -> DealResponse:
    return DealResponse(
        id=deal.id,
        agency_id=deal.agency_id,
        lead_id=deal.lead_id,
        property_id=deal.property_id,
        agent_id=deal.agent_id,
        title=deal.title,
        stage=deal.stage,
        deal_value_pkr=deal.deal_value_pkr,
        token_amount_pkr=deal.token_amount_pkr,
        token_date=deal.token_date,
        token_type=deal.token_type,
        bayana_amount_pkr=deal.bayana_amount_pkr,
        bayana_date=deal.bayana_date,
        iqrarnama_number=deal.iqrarnama_number,
        noc_authority=deal.noc_authority,
        ndc_cleared=deal.ndc_cleared,
        transfer_date=deal.transfer_date,
        registry_number=deal.registry_number,
        commission_side=deal.commission_side,
        commission_percentage=deal.commission_percentage,
        commission_pkr=deal.commission_pkr,
        agency_split_percentage=deal.agency_split_percentage,
        agent_split_percentage=deal.agent_split_percentage,
        agency_commission_pkr=deal.agency_commission_pkr,
        agent_commission_pkr=deal.agent_commission_pkr,
        settlement_status=deal.settlement_status,
        expected_close_date=deal.expected_close_date,
        notes=deal.notes,
        closed_at=deal.closed_at,
        created_at=deal.created_at,
        updated_at=deal.updated_at,
        lead_name=deal.lead.full_name if deal.lead else None,
        lead_phone=deal.lead.phone if deal.lead else None,
        property_title=deal.property.title if deal.property else None,
        property_location=deal.property.location if deal.property else None,
        agent_name=deal.agent.full_name if deal.agent else None,
    )


@router.post("/calculate-commission", response_model=CommissionCalculatorResponse)
def calculate_commission(
    payload: CommissionCalculatorRequest,
    ctx: TenantContext = Depends(get_tenant_context),
) -> Any:
    """
    Automates Pakistani real estate commission splits (Buyer 1% + Seller 1% = 2% total; Agency vs Agent splits).
    """
    effective_pct, total_comm, agency_cut, agent_cut = compute_commission_splits(
        payload.deal_value_pkr,
        payload.commission_side,
        payload.custom_commission_percentage,
        payload.agency_split_percentage,
        payload.agent_split_percentage,
    )

    return CommissionCalculatorResponse(
        deal_value_pkr=payload.deal_value_pkr,
        commission_side=payload.commission_side,
        commission_percentage=effective_pct,
        total_commission_pkr=total_comm,
        agency_commission_pkr=agency_cut,
        agent_commission_pkr=agent_cut,
        formatted_deal_value=format_pkr_crore_lakh(payload.deal_value_pkr),
        formatted_total_commission=format_pkr_crore_lakh(total_comm),
        formatted_agency_commission=format_pkr_crore_lakh(agency_cut),
        formatted_agent_commission=format_pkr_crore_lakh(agent_cut),
    )


@router.get("", response_model=List[DealResponse])
def get_deals(
    stage: Optional[str] = None,
    agent_id: Optional[str] = None,
    lead_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    ctx: TenantContext = Depends(get_tenant_context),
) -> Any:
    """
    Retrieve all deals for the agency, supporting filtering by Pakistani stages and search.
    """
    query = db.query(Deal).filter(Deal.agency_id == ctx.agency_id)

    # Agents see deals assigned to them OR deals for leads assigned to them
    if ctx.is_agent:
        query = query.outerjoin(Lead, Deal.lead_id == Lead.id).filter(
            or_(
                Deal.agent_id == ctx.user_id,
                Lead.assigned_agent_id == ctx.user_id,
            )
        )
    elif agent_id:
        query = query.filter(Deal.agent_id == agent_id)

    if stage:
        query = query.filter(Deal.stage == stage)

    if lead_id:
        query = query.filter(Deal.lead_id == lead_id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Deal.title.ilike(search_term),
                Deal.iqrarnama_number.ilike(search_term),
                Deal.registry_number.ilike(search_term),
                Deal.noc_authority.ilike(search_term),
            )
        )

    deals = query.order_by(desc(Deal.created_at)).offset(skip).limit(limit).all()
    return [serialize_deal(d) for d in deals]


@router.get("/{deal_id}", response_model=DealResponse)
def get_deal_by_id(
    deal_id: str,
    db: Session = Depends(get_db),
    ctx: TenantContext = Depends(get_tenant_context),
) -> Any:
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.agency_id == ctx.agency_id).first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")

    if ctx.is_agent and deal.agent_id != ctx.user_id:
        if not (deal.lead and deal.lead.assigned_agent_id == ctx.user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return serialize_deal(deal)


@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    deal_in: DealCreate,
    db: Session = Depends(get_db),
    ctx: TenantContext = Depends(require_active_subscription),
) -> Any:
    """
    Create a new Pakistani real estate deal with Token (Booking), Bayana, or Commission parameters.
    """
    # Verify Lead exists and belongs to current agency
    lead = db.query(Lead).filter(Lead.id == deal_in.lead_id, Lead.agency_id == ctx.agency_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found in this agency")

    # Prevent duplicate active deals for the same lead
    existing_deal = (
        db.query(Deal)
        .filter(
            Deal.agency_id == ctx.agency_id,
            Deal.lead_id == deal_in.lead_id,
            Deal.stage.notin_(["cancelled"]),
        )
        .first()
    )
    if existing_deal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An active deal '{existing_deal.title}' already exists for this lead in stage '{existing_deal.stage.upper()}'. Duplicate deals for the same lead are not permitted.",
        )

    # Verify Property if provided
    if deal_in.property_id:
        prop = db.query(Property).filter(Property.id == deal_in.property_id, Property.agency_id == ctx.agency_id).first()
        if not prop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found in this agency")

    # Determine assigned agent: if not explicitly provided, inherit lead's assigned agent, or fallback to current user
    agent_id = deal_in.agent_id or lead.assigned_agent_id or ctx.user_id
    if ctx.is_agent:
        agent_id = ctx.user_id

    # Auto-calculate commission splits if not manually fully specified
    effective_pct, total_comm, agency_cut, agent_cut = compute_commission_splits(
        deal_in.deal_value_pkr,
        deal_in.commission_side,
        deal_in.commission_percentage if deal_in.commission_side == "custom" else None,
        deal_in.agency_split_percentage,
        deal_in.agent_split_percentage,
    )

    deal = Deal(
        agency_id=ctx.agency_id,
        lead_id=deal_in.lead_id,
        property_id=deal_in.property_id,
        agent_id=agent_id,
        title=deal_in.title,
        stage=deal_in.stage,
        deal_value_pkr=deal_in.deal_value_pkr,
        token_amount_pkr=deal_in.token_amount_pkr,
        token_date=deal_in.token_date,
        token_type=deal_in.token_type or "pakka_token",
        bayana_amount_pkr=deal_in.bayana_amount_pkr,
        bayana_date=deal_in.bayana_date,
        iqrarnama_number=deal_in.iqrarnama_number,
        noc_authority=deal_in.noc_authority,
        ndc_cleared=deal_in.ndc_cleared,
        transfer_date=deal_in.transfer_date,
        registry_number=deal_in.registry_number,
        commission_side=deal_in.commission_side,
        commission_percentage=effective_pct,
        commission_pkr=total_comm,
        agency_split_percentage=deal_in.agency_split_percentage,
        agent_split_percentage=deal_in.agent_split_percentage,
        agency_commission_pkr=agency_cut,
        agent_commission_pkr=agent_cut,
        settlement_status=deal_in.settlement_status or "pending",
        expected_close_date=deal_in.expected_close_date,
        notes=deal_in.notes,
    )

    db.add(deal)

    # Lead Activity Log
    token_str = format_pkr_crore_lakh(deal_in.token_amount_pkr) if deal_in.token_amount_pkr > 0 else "N/A"
    activity = LeadActivity(
        agency_id=ctx.agency_id,
        lead_id=lead.id,
        user_id=ctx.user_id,
        performed_by_name=ctx.user.full_name if ctx.user else "Agent",
        type="deal_created",
        title=f"Deal Initiated: {deal.title}",
        description=f"Initiated Pakistani Real Estate Deal: '{deal.title}' (Stage: {deal.stage.upper()}, Deal Value: {format_pkr_crore_lakh(deal.deal_value_pkr)}, Token Advance: {token_str})",
    )
    db.add(activity)

    db.commit()
    db.refresh(deal)
    return serialize_deal(deal)


@router.patch("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: str,
    deal_update: DealUpdate,
    db: Session = Depends(get_db),
    ctx: TenantContext = Depends(get_tenant_context),
) -> Any:
    """
    Update deal details or transition stages: Token -> Bayana -> NOC Verification -> Final Registry / Transfer -> Completed.
    """
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.agency_id == ctx.agency_id).first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")

    if ctx.is_agent and deal.agent_id != ctx.user_id:
        if not (deal.lead and deal.lead.assigned_agent_id == ctx.user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    prev_stage = deal.stage
    prev_bayana = deal.bayana_amount_pkr
    prev_token = deal.token_amount_pkr
    update_data = deal_update.model_dump(exclude_unset=True)

    # Apply updates
    for field, val in update_data.items():
        setattr(deal, field, val)

    # Recalculate commissions if values changed
    if any(k in update_data for k in ["deal_value_pkr", "commission_side", "commission_percentage", "agency_split_percentage", "agent_split_percentage"]):
        eff_pct, total_comm, agency_cut, agent_cut = compute_commission_splits(
            deal.deal_value_pkr,
            deal.commission_side,
            deal.commission_percentage if deal.commission_side == "custom" else None,
            deal.agency_split_percentage,
            deal.agent_split_percentage,
        )
        deal.commission_percentage = eff_pct
        deal.commission_pkr = total_comm
        deal.agency_commission_pkr = agency_cut
        deal.agent_commission_pkr = agent_cut

    # Handle completion status
    if deal.stage == "completed" and prev_stage != "completed":
        deal.closed_at = datetime.now(timezone.utc)

    # Activity timeline logging on stage transition
    if "stage" in update_data and deal.stage != prev_stage:
        stage_descriptions = {
            "token": f"Deal set to Token Stage (Token Advance: {format_pkr_crore_lakh(deal.token_amount_pkr)} [{deal.token_type}])",
            "bayana": f"Deal moved to Bayana Stage (Signed Iqrarnama #{deal.iqrarnama_number or 'Pending'}, Bayana Amount: {format_pkr_crore_lakh(deal.bayana_amount_pkr)})",
            "noc_verification": f"Deal moved to NOC Verification (Authority: {deal.noc_authority or 'Authority'}, NDC Cleared: {'Yes' if deal.ndc_cleared else 'Pending'})",
            "final_transfer": f"Deal reached Final Society Transfer / Registry (Registry #{deal.registry_number or 'In Progress'}, Transfer Date: {deal.transfer_date or 'TBD'})",
            "completed": f"Deal Successfully Completed! Value: {format_pkr_crore_lakh(deal.deal_value_pkr)}, Total Commission: {format_pkr_crore_lakh(deal.commission_pkr)} (Agency: {format_pkr_crore_lakh(deal.agency_commission_pkr)}, Agent: {format_pkr_crore_lakh(deal.agent_commission_pkr)})",
            "cancelled": f"Deal Cancelled at {prev_stage.upper()} stage.",
        }
        activity = LeadActivity(
            agency_id=ctx.agency_id,
            lead_id=deal.lead_id,
            user_id=ctx.user_id,
            performed_by_name=ctx.user.full_name if ctx.user else "Agent",
            type="deal_stage_changed",
            title=f"Deal Stage Changed: {deal.title} → {deal.stage.upper()}",
            description=stage_descriptions.get(deal.stage, f"Deal stage updated from {prev_stage} to {deal.stage}"),
        )
        db.add(activity)
    elif "bayana_amount_pkr" in update_data and deal.bayana_amount_pkr and prev_bayana != deal.bayana_amount_pkr:
        # Also retroactively update any existing "Deal moved to Bayana Stage" activity that had PKR 0
        old_bayana_act = (
            db.query(LeadActivity)
            .filter(
                LeadActivity.lead_id == deal.lead_id,
                LeadActivity.type == "deal_stage_changed",
                LeadActivity.description.like("%Bayana Amount: PKR 0%"),
            )
            .first()
        )
        if old_bayana_act:
            old_bayana_act.description = old_bayana_act.description.replace(
                "Bayana Amount: PKR 0", f"Bayana Amount: {format_pkr_crore_lakh(deal.bayana_amount_pkr)}"
            )

        activity = LeadActivity(
            agency_id=ctx.agency_id,
            lead_id=deal.lead_id,
            user_id=ctx.user_id,
            performed_by_name=ctx.user.full_name if ctx.user else "Agent",
            type="deal_updated",
            title=f"Bayana Deposit Recorded: {deal.title}",
            description=f"Bayana Deposit updated to {format_pkr_crore_lakh(deal.bayana_amount_pkr)} (Signed Iqrarnama #{deal.iqrarnama_number or 'Pending'})",
        )
        db.add(activity)

    db.commit()
    db.refresh(deal)
    return serialize_deal(deal)


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    ctx: TenantContext = Depends(get_tenant_context),
) -> None:
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.agency_id == ctx.agency_id).first()
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")

    if ctx.is_agent and deal.agent_id != ctx.user_id:
        if not (deal.lead and deal.lead.assigned_agent_id == ctx.user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    db.delete(deal)
    db.commit()
