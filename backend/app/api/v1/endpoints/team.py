from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_tenant_context, require_owner, require_manager, TenantContext
from app.models.user import User
from app.models.agency import AgencyMembership
from app.models.lead import Lead
from app.models.deal import Deal
from app.schemas.user import AgentPerformanceResponse, UserCreate, UserResponse, UserUpdate
from app.schemas.auth import ResetAgentPasswordRequest
from app.schemas.common import MessageResponse
from app.core.security import get_password_hash, validate_password_strength

router = APIRouter()


@router.get("", response_model=List[AgentPerformanceResponse])
def get_team_members(
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    # Get all active memberships in current agency
    memberships = (
        db.query(AgencyMembership)
        .filter(
            AgencyMembership.agency_id == tenant.agency_id,
            AgencyMembership.is_active == True,
        )
        .all()
    )

    results = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if not user:
            continue

        # Count active assigned leads
        active_leads = (
            db.query(func.count(Lead.id))
            .filter(
                Lead.agency_id == tenant.agency_id,
                Lead.assigned_agent_id == user.id,
                Lead.status.notin_(["won", "lost"]),
            )
            .scalar()
            or 0
        )

        total_leads = (
            db.query(func.count(Lead.id))
            .filter(
                Lead.agency_id == tenant.agency_id,
                Lead.assigned_agent_id == user.id,
            )
            .scalar()
            or 0
        )

        # Count won deals and closed revenue
        deals_query = (
            db.query(
                func.count(Deal.id).label("deals_count"),
                func.sum(Deal.deal_value_pkr).label("revenue_sum"),
            )
            .filter(
                Deal.agency_id == tenant.agency_id,
                Deal.agent_id == user.id,
                Deal.stage == "closed_won",
            )
            .first()
        )

        deals_closed = deals_query.deals_count if deals_query and deals_query.deals_count else 0
        revenue_pkr = (
            Decimal(str(deals_query.revenue_sum))
            if deals_query and deals_query.revenue_sum is not None
            else Decimal("0.00")
        )

        conversion_rate = round((deals_closed / total_leads * 100), 1) if total_leads > 0 else 0.0

        results.append(
            AgentPerformanceResponse(
                id=user.id,
                name=user.full_name,
                email=user.email,
                phone=user.phone,
                role=user.role_title or m.role.capitalize(),
                avatar_url=user.avatar_url,
                deals_closed=deals_closed,
                revenue_pkr=revenue_pkr,
                target_pkr=user.monthly_target_pkr or Decimal("80000000.00"),
                active_leads=active_leads,
                conversion_rate=conversion_rate,
                status="Active" if user.is_active else "Inactive",
                system_role=m.role,
            )
        )

    return results


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def add_team_member(
    data: UserCreate,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
):
    # Enforce safe assigned role
    assigned_role = (data.role or "agent").lower().strip()
    if assigned_role not in ("manager", "agent"):
        assigned_role = "agent"

    # Check if user already exists
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        # Check if already a member of this agency
        existing_membership = (
            db.query(AgencyMembership)
            .filter(
                AgencyMembership.agency_id == tenant.agency_id,
                AgencyMembership.user_id == existing.id,
            )
            .first()
        )
        if existing_membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this agency",
            )
        user = existing
    else:
        validate_password_strength(data.password)
        user = User(
            email=data.email.lower().strip(),
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role_title=data.role_title,
            avatar_url=data.avatar_url,
            monthly_target_pkr=data.monthly_target_pkr,
        )
        db.add(user)
        db.flush()

    # Create agency membership
    membership = AgencyMembership(
        agency_id=tenant.agency_id,
        user_id=user.id,
        role=assigned_role,
        is_active=True,
    )
    db.add(membership)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role_title=user.role_title,
        role=membership.role,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        monthly_target_pkr=user.monthly_target_pkr,
        created_at=user.created_at,
    )


@router.patch("/{user_id}", response_model=UserResponse)
def update_team_member(
    user_id: str,
    data: UserUpdate,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
):
    membership = (
        db.query(AgencyMembership)
        .filter(
            AgencyMembership.agency_id == tenant.agency_id,
            AgencyMembership.user_id == user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found in this agency",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found",
        )

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.role_title is not None:
        user.role_title = data.role_title
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    if data.monthly_target_pkr is not None:
        user.monthly_target_pkr = data.monthly_target_pkr
    if data.is_active is not None:
        user.is_active = data.is_active
        membership.is_active = data.is_active
    if data.role is not None:
        assigned_role = data.role.lower().strip()
        if assigned_role in ("manager", "agent"):
            membership.role = assigned_role

    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role_title=user.role_title,
        role=membership.role,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        monthly_target_pkr=user.monthly_target_pkr,
        created_at=user.created_at,
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    user_id: str,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
):
    if user_id == tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agency owners cannot delete their own master account",
        )

    membership = (
        db.query(AgencyMembership)
        .filter(
            AgencyMembership.agency_id == tenant.agency_id,
            AgencyMembership.user_id == user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found in this agency",
        )

    # Deactivate membership and user
    membership.is_active = False
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_active = False

    db.commit()
    return None


@router.post("/{user_id}/reset-password", response_model=MessageResponse)
def reset_team_member_password(
    user_id: str,
    data: ResetAgentPasswordRequest,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
):
    """
    Allow Agency Owner to directly set a new login password for any agent or manager in their agency.
    """
    membership = (
        db.query(AgencyMembership)
        .filter(
            AgencyMembership.agency_id == tenant.agency_id,
            AgencyMembership.user_id == user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found in this agency",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found",
        )

    # Enforce enterprise password policy
    validate_password_strength(data.new_password)

    user.hashed_password = get_password_hash(data.new_password.strip())
    # Invalidate all prior active sessions for this agent
    user.token_version = (getattr(user, "token_version", 1) or 1) + 1
    db.commit()

    return MessageResponse(
        message=f"Login password for {user.full_name} has been updated successfully. Existing sessions have been signed out."
    )

