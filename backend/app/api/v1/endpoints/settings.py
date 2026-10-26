from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_tenant_context, require_owner, TenantContext
from app.models.agency import Agency
from app.schemas.agency import (
    AgencyResponse,
    AgencyUpdate,
    SubscriptionActivateRequest,
    SubscriptionResetRequest,
)

router = APIRouter()


@router.get("/agency", response_model=AgencyResponse)
def get_agency_settings(
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    agency = db.query(Agency).filter(Agency.id == tenant.agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )
    return agency


@router.patch("/agency", response_model=AgencyResponse)
def update_agency_settings(
    data: AgencyUpdate,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
):
    agency = db.query(Agency).filter(Agency.id == tenant.agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(agency, key, value)

    db.commit()
    db.refresh(agency)

    return agency


@router.post("/agency/activate-subscription", response_model=AgencyResponse)
def activate_agency_subscription(
    data: SubscriptionActivateRequest,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """
    Activates or extends an agency's paid subscription license.
    """
    agency = db.query(Agency).filter(Agency.id == tenant.agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )

    now_utc = datetime.now(timezone.utc)
    duration_days = max(30, data.duration_months * 30)

    # If already active and not expired, extend from existing expiration
    if agency.subscription_expires_at and agency.subscription_expires_at > now_utc:
        new_expiry = agency.subscription_expires_at + timedelta(days=duration_days)
    else:
        new_expiry = now_utc + timedelta(days=duration_days)

    agency.subscription_status = "active"
    agency.subscription_plan = data.plan
    agency.subscription_expires_at = new_expiry

    db.commit()
    db.refresh(agency)
    return agency


@router.post("/agency/reset-trial", response_model=AgencyResponse)
def reset_agency_trial(
    data: SubscriptionResetRequest,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """
    Restarts a free trial window (default 3 days from now).
    Useful for agency testing, demo periods, or sales extensions.
    """
    agency = db.query(Agency).filter(Agency.id == tenant.agency_id).first()
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found",
        )

    now_utc = datetime.now(timezone.utc)
    trial_days = max(1, min(14, data.trial_days))

    agency.subscription_status = "trial"
    agency.trial_ends_at = now_utc + timedelta(days=trial_days)

    db.commit()
    db.refresh(agency)
    return agency
