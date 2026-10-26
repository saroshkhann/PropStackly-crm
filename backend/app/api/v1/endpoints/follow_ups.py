from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc

from app.api.deps import get_db, get_tenant_context, TenantContext
from app.models.task import FollowUp
from app.models.lead import Lead, LeadActivity
from app.schemas.task import (
    FollowUpCreate,
    FollowUpUpdate,
    FollowUpResponse,
)
from app.schemas.common import MessageResponse

router = APIRouter()


def _format_followup(f: FollowUp) -> dict:
    return {
        "id": f.id,
        "agency_id": f.agency_id,
        "lead_id": f.lead_id,
        "lead_name": f.lead.full_name if f.lead else None,
        "lead_phone": f.lead.phone if f.lead else None,
        "assigned_agent_id": f.assigned_agent_id,
        "assigned_agent_name": f.assigned_agent.full_name if f.assigned_agent else None,
        "scheduled_date": f.scheduled_date,
        "scheduled_time": f.scheduled_time,
        "type": f.type,
        "notes": f.notes,
        "priority": f.priority,
        "completed": f.completed,
        "completed_at": f.completed_at,
        "completed_by_id": getattr(f, "completed_by_id", None),
        "completed_by_name": f.completed_by.full_name if getattr(f, "completed_by", None) else None,
        "created_at": f.created_at,
        "updated_at": f.updated_at,
    }


@router.get("", response_model=List[FollowUpResponse])
def get_followups(
    scheduled_date: Optional[str] = None,
    completed: Optional[bool] = None,
    timeline: Optional[str] = Query(None, description="overdue, today, upcoming, completed"),
    lead_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    query = (
        db.query(FollowUp)
        .options(
            joinedload(FollowUp.lead),
            joinedload(FollowUp.assigned_agent),
            joinedload(FollowUp.completed_by),
        )
        .filter(FollowUp.agency_id == tenant.agency_id)
    )

    # RBAC: Agents only view their own assigned follow-ups
    if tenant.is_agent:
        query = query.filter(FollowUp.assigned_agent_id == tenant.user_id)
    elif agent_id:
        query = query.filter(FollowUp.assigned_agent_id == agent_id)

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if timeline == "overdue":
        query = query.filter(FollowUp.scheduled_date < today_str, FollowUp.completed == False)
    elif timeline == "today":
        query = query.filter(FollowUp.scheduled_date == today_str, FollowUp.completed == False)
    elif timeline == "upcoming":
        query = query.filter(FollowUp.scheduled_date > today_str, FollowUp.completed == False)
    elif timeline == "completed":
        query = query.filter(FollowUp.completed == True)

    if scheduled_date:
        query = query.filter(FollowUp.scheduled_date == scheduled_date)

    if completed is not None and not timeline:
        query = query.filter(FollowUp.completed == completed)

    if lead_id:
        query = query.filter(FollowUp.lead_id == lead_id)

    followups = query.order_by(asc(FollowUp.scheduled_date), asc(FollowUp.scheduled_time)).all()
    return [_format_followup(f) for f in followups]


@router.post("", response_model=FollowUpResponse, status_code=status.HTTP_201_CREATED)
def create_followup(
    data: FollowUpCreate,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
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

    # RBAC: Agent can only schedule follow-ups for leads assigned to them
    if tenant.is_agent and lead.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You can only schedule follow-ups for leads assigned to you.",
        )

    assigned_agent_id = tenant.user_id if tenant.is_agent else (data.assigned_agent_id or lead.assigned_agent_id or tenant.user.id)

    followup = FollowUp(
        agency_id=tenant.agency_id,
        lead_id=data.lead_id,
        assigned_agent_id=assigned_agent_id,
        scheduled_date=data.scheduled_date,
        scheduled_time=data.scheduled_time,
        type=data.type,
        notes=data.notes,
        priority=data.priority,
        completed=False,
    )
    db.add(followup)

    # Activity log
    activity = LeadActivity(
        agency_id=tenant.agency_id,
        lead_id=lead.id,
        user_id=tenant.user.id,
        performed_by_name=tenant.user.full_name,
        type="follow_up_scheduled",
        title=f"Follow-up Scheduled ({data.type})",
        description=f"Due on {data.scheduled_date} at {data.scheduled_time}: {data.notes}",
    )
    db.add(activity)

    db.commit()
    db.refresh(followup)

    return _format_followup(followup)


@router.patch("/{followup_id}", response_model=FollowUpResponse)
def update_followup(
    followup_id: str,
    data: FollowUpUpdate,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    followup = (
        db.query(FollowUp)
        .options(joinedload(FollowUp.lead), joinedload(FollowUp.assigned_agent))
        .filter(FollowUp.id == followup_id, FollowUp.agency_id == tenant.agency_id)
        .first()
    )
    if not followup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found",
        )

    # RBAC: Agent can only update their own follow-ups
    if tenant.is_agent and followup.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You can only update follow-ups assigned to you.",
        )

    was_completed = followup.completed
    update_dict = data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        setattr(followup, key, value)

    if "completed" in update_dict:
        if update_dict["completed"] and not was_completed:
            followup.completed_at = datetime.now(timezone.utc)
            followup.completed_by_id = tenant.user.id
            db.add(
                LeadActivity(
                    agency_id=tenant.agency_id,
                    lead_id=followup.lead_id,
                    user_id=tenant.user.id,
                    performed_by_name=tenant.user.full_name,
                    type="call",
                    title="Follow-up Completed",
                    description=f"Completed {followup.type}: {followup.notes}",
                )
            )
        elif not update_dict["completed"]:
            followup.completed_at = None
            followup.completed_by_id = None

    db.commit()
    db.refresh(followup)

    return _format_followup(followup)


@router.delete("/{followup_id}", response_model=MessageResponse)
def delete_followup(
    followup_id: str,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    followup = (
        db.query(FollowUp)
        .filter(FollowUp.id == followup_id, FollowUp.agency_id == tenant.agency_id)
        .first()
    )
    if not followup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found",
        )

    # RBAC: Agent can only delete their own follow-ups
    if tenant.is_agent and followup.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You can only delete follow-ups assigned to you.",
        )

    db.delete(followup)
    db.commit()
    return MessageResponse(message="Follow-up deleted successfully")
