from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc

from app.api.deps import get_db, get_tenant_context, TenantContext
from app.models.task import SiteVisit
from app.models.lead import Lead, LeadActivity
from app.models.property import Property
from app.models.user import User
from app.schemas.task import (
    SiteVisitCreate,
    SiteVisitUpdate,
    SiteVisitResponse,
)
from app.schemas.common import MessageResponse

router = APIRouter()


def _format_visit(v: SiteVisit) -> dict:
    return {
        "id": v.id,
        "agency_id": v.agency_id,
        "lead_id": v.lead_id,
        "property_id": v.property_id,
        "assigned_agent_id": v.assigned_agent_id,
        "visit_date": v.visit_date,
        "visit_time": v.visit_time,
        "status": v.status,
        "notes": v.notes,
        "client_feedback": v.client_feedback,
        "lead_name": v.lead.full_name if v.lead else None,
        "lead_phone": v.lead.phone if v.lead else None,
        "property_title": v.property.title if v.property else None,
        "property_location": v.property.location if v.property else None,
        "assigned_agent_name": v.assigned_agent.full_name if v.assigned_agent else None,
        "created_at": v.created_at,
        "updated_at": v.updated_at,
    }


@router.get("", response_model=List[SiteVisitResponse])
def get_site_visits(
    visit_date: Optional[str] = None,
    status: Optional[str] = None,
    lead_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    query = (
        db.query(SiteVisit)
        .options(
            joinedload(SiteVisit.lead),
            joinedload(SiteVisit.property),
            joinedload(SiteVisit.assigned_agent),
        )
        .filter(SiteVisit.agency_id == tenant.agency_id)
    )

    # RBAC: Agents only view their own assigned site visits
    if tenant.is_agent:
        query = query.filter(SiteVisit.assigned_agent_id == tenant.user_id)
    elif agent_id:
        query = query.filter(SiteVisit.assigned_agent_id == agent_id)

    if visit_date:
        query = query.filter(SiteVisit.visit_date == visit_date)

    if status and status != "all":
        query = query.filter(SiteVisit.status == status)

    if lead_id:
        query = query.filter(SiteVisit.lead_id == lead_id)

    visits = query.order_by(asc(SiteVisit.visit_date), asc(SiteVisit.visit_time)).all()
    return [_format_visit(v) for v in visits]


@router.post("", response_model=SiteVisitResponse, status_code=status.HTTP_201_CREATED)
def create_site_visit(
    data: SiteVisitCreate,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    # Validate visit date
    try:
        parsed_date = datetime.strptime(data.visit_date.strip(), "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid visit_date format. Date must be YYYY-MM-DD.",
        )

    today = datetime.now(timezone.utc).date()
    if parsed_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot schedule site visit in the past (requested date: {data.visit_date}, today: {today}).",
        )

    lead = (
        db.query(Lead)
        .filter(Lead.id == data.lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found in this agency",
        )

    # RBAC: Agent can only schedule visits for leads assigned to them
    if tenant.is_agent and lead.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You can only schedule site visits for leads assigned to you.",
        )

    prop = (
        db.query(Property)
        .filter(Property.id == data.property_id, Property.agency_id == tenant.agency_id)
        .first()
    )
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found in this agency",
        )

    agent_id = tenant.user_id if tenant.is_agent else (data.assigned_agent_id or prop.assigned_agent_id or lead.assigned_agent_id or tenant.user.id)

    # Scheduling conflict checks: prevent double-booking agent or property at exact same date & time
    agent_conflict = (
        db.query(SiteVisit)
        .filter(
            SiteVisit.agency_id == tenant.agency_id,
            SiteVisit.assigned_agent_id == agent_id,
            SiteVisit.visit_date == data.visit_date.strip(),
            SiteVisit.visit_time == data.visit_time.strip(),
            SiteVisit.status == "scheduled",
        )
        .first()
    )
    if agent_conflict:
        assigned_user = db.query(User).filter(User.id == agent_id).first()
        agent_name = assigned_user.full_name if assigned_user else "Assigned consultant"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Scheduling conflict: {agent_name} already has a site visit scheduled on {data.visit_date} at {data.visit_time}.",
        )

    property_conflict = (
        db.query(SiteVisit)
        .filter(
            SiteVisit.agency_id == tenant.agency_id,
            SiteVisit.property_id == data.property_id,
            SiteVisit.visit_date == data.visit_date.strip(),
            SiteVisit.visit_time == data.visit_time.strip(),
            SiteVisit.status == "scheduled",
        )
        .first()
    )
    if property_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Scheduling conflict: Property '{prop.title}' already has a client visit booked on {data.visit_date} at {data.visit_time}.",
        )

    visit = SiteVisit(
        agency_id=tenant.agency_id,
        lead_id=data.lead_id,
        property_id=data.property_id,
        assigned_agent_id=agent_id,
        visit_date=data.visit_date.strip(),
        visit_time=data.visit_time.strip(),
        status=data.status,
        notes=data.notes,
        client_feedback=data.client_feedback,
    )
    db.add(visit)

    # Activity log on lead
    db.add(
        LeadActivity(
            agency_id=tenant.agency_id,
            lead_id=lead.id,
            user_id=tenant.user.id,
            performed_by_name=tenant.user.full_name,
            type="site_visit",
            title="Site Visit Scheduled",
            description=f"Visit scheduled for {prop.title} on {data.visit_date} at {data.visit_time}",
        )
    )

    db.commit()
    db.refresh(visit)

    return _format_visit(visit)


@router.patch("/{visit_id}", response_model=SiteVisitResponse)
def update_site_visit(
    visit_id: str,
    data: SiteVisitUpdate,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    visit = (
        db.query(SiteVisit)
        .options(
            joinedload(SiteVisit.lead),
            joinedload(SiteVisit.property),
            joinedload(SiteVisit.assigned_agent),
        )
        .filter(SiteVisit.id == visit_id, SiteVisit.agency_id == tenant.agency_id)
        .first()
    )
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site visit not found",
        )

    # RBAC: Agent can only update their own site visits
    if tenant.is_agent and visit.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You can only update site visits assigned to you.",
        )

    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(visit, key, value)

    # If status changed to completed, log activity
    if "status" in update_dict:
        db.add(
            LeadActivity(
                agency_id=tenant.agency_id,
                lead_id=visit.lead_id,
                user_id=tenant.user.id,
                performed_by_name=tenant.user.full_name,
                type="site_visit",
                title=f"Site Visit Updated ({visit.status})",
                description=f"Status: {visit.status}. Feedback: {visit.client_feedback or 'None provided'}",
            )
        )

    db.commit()
    db.refresh(visit)

    return _format_visit(visit)


@router.delete("/{visit_id}", response_model=MessageResponse)
def delete_site_visit(
    visit_id: str,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    visit = (
        db.query(SiteVisit)
        .filter(SiteVisit.id == visit_id, SiteVisit.agency_id == tenant.agency_id)
        .first()
    )
    if not visit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site visit not found",
        )

    # RBAC: Agent can only delete their own site visits
    if tenant.is_agent and visit.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You can only delete site visits assigned to you.",
        )

    db.delete(visit)
    db.commit()
    return MessageResponse(message="Site visit deleted successfully")
