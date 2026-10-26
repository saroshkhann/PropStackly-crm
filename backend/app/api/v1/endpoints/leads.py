from typing import Optional, List
import math
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, asc

from app.api.deps import (
    get_db,
    get_tenant_context,
    require_manager,
    require_active_subscription,
    TenantContext,
)
from app.models.lead import Lead, LeadNote, LeadActivity, LeadAssignment, LeadPropertyAssociation
from app.models.property import Property
from app.models.user import User
from app.models.agency import AgencyMembership
from app.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadAssignRequest,
    LeadNoteCreate,
    LeadNoteResponse,
    LeadActivityCreate,
    LeadActivityResponse,
    LeadPropertyAssociationCreate,
    LeadPropertyAssociationResponse,
    LeadMatchesResponse,
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.notification_service import NotificationService
from app.services.automation_service import AutomationService
from app.services.matching_service import MatchingService
import logging

logger = logging.getLogger("propstackly.leads")

router = APIRouter()


def _format_lead(lead: Lead) -> dict:
    return {
        "id": lead.id,
        "agency_id": lead.agency_id,
        "full_name": lead.full_name,
        "phone": lead.phone,
        "email": lead.email,
        "city": lead.city,
        "source": lead.source,
        "status": lead.status,
        "priority": lead.priority,
        "budget_pkr": lead.budget_pkr,
        "property_type_interest": lead.property_type_interest,
        "preferred_locations": lead.preferred_locations,
        "purpose": lead.purpose,
        "assigned_agent_id": lead.assigned_agent_id,
        "assigned_agent_name": lead.assigned_agent.full_name if getattr(lead, "assigned_agent", None) else None,
        "is_archived": bool(getattr(lead, "is_archived", False)),
        "created_by_id": getattr(lead, "created_by_id", None),
        "created_by_name": lead.created_by.full_name if getattr(lead, "created_by", None) else None,
        "updated_by_id": getattr(lead, "updated_by_id", None),
        "updated_by_name": lead.updated_by.full_name if getattr(lead, "updated_by", None) else None,
        "last_contacted_at": lead.last_contacted_at,
        "next_followup_at": lead.next_followup_at,
        "created_at": lead.created_at,
        "updated_at": lead.updated_at,
        "notes": [
            {
                "id": n.id,
                "lead_id": n.lead_id,
                "author_name": n.author_name,
                "content": n.content,
                "created_at": n.created_at,
            }
            for n in lead.notes
        ] if hasattr(lead, "notes") and lead.notes else [],
        "activities": [
            {
                "id": a.id,
                "lead_id": a.lead_id,
                "type": a.type,
                "title": a.title,
                "description": a.description,
                "performed_by_name": a.performed_by_name,
                "created_at": a.created_at,
            }
            for a in lead.activities
        ] if hasattr(lead, "activities") and lead.activities else [],
        "associated_properties": [
            {
                "id": assoc.id,
                "property_id": assoc.property_id,
                "property_title": assoc.property.title if assoc.property else "Property",
                "property_location": assoc.property.location if assoc.property else "",
                "property_society": assoc.property.society if assoc.property else "",
                "property_price_pkr": assoc.property.price_pkr if assoc.property else 0,
                "property_type": assoc.property.type if assoc.property else "",
                "property_image_url": assoc.property.image_url if assoc.property else None,
                "notes": assoc.notes,
                "created_at": assoc.created_at,
            }
            for assoc in (lead.associated_properties or [])
            if hasattr(assoc, "property") and assoc.property
        ] if hasattr(lead, "associated_properties") and lead.associated_properties else [],
    }


@router.get("", response_model=PaginatedResponse[LeadResponse])
def get_leads(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    priority: Optional[str] = None,
    agent_id: Optional[str] = None,
    is_archived: bool = Query(False, description="Filter active vs archived leads"),
    sort_by: str = Query("created_at", pattern="^(created_at|budget_pkr|full_name)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    # Strictly scoped to authenticated user's agency
    query = (
        db.query(Lead)
        .options(
            joinedload(Lead.assigned_agent),
            joinedload(Lead.created_by),
            joinedload(Lead.updated_by),
        )
        .filter(Lead.agency_id == tenant.agency_id, Lead.is_archived == is_archived)
    )

    # RBAC: Agents can ONLY see leads assigned to them!
    if tenant.is_agent:
        query = query.filter(Lead.assigned_agent_id == tenant.user_id)
    elif agent_id and agent_id != "all":
        query = query.filter(Lead.assigned_agent_id == agent_id)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Lead.full_name.ilike(search_fmt),
                Lead.phone.ilike(search_fmt),
                Lead.email.ilike(search_fmt),
                Lead.preferred_locations.ilike(search_fmt),
            )
        )

    if status and status != "all":
        query = query.filter(Lead.status == status)

    if source and source != "all":
        query = query.filter(Lead.source == source)

    if priority and priority != "all":
        query = query.filter(Lead.priority == priority)

    total = query.count()

    # Sorting
    col = getattr(Lead, sort_by)
    query = query.order_by(desc(col) if order == "desc" else asc(col))

    # Pagination
    offset = (page - 1) * size
    leads = query.offset(offset).limit(size).all()
    pages = math.ceil(total / size) if size > 0 else 1

    items = [_format_lead(l) for l in leads]

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    data: LeadCreate,
    tenant: TenantContext = Depends(require_active_subscription),
    db: Session = Depends(get_db),
):
    # RBAC: Agents can only assign newly created leads to themselves
    assigned_agent_id = data.assigned_agent_id
    if tenant.is_agent:
        assigned_agent_id = tenant.user_id
    elif assigned_agent_id:
        agent_membership = (
            db.query(AgencyMembership)
            .filter(
                AgencyMembership.agency_id == tenant.agency_id,
                AgencyMembership.user_id == assigned_agent_id,
            )
            .first()
        )
        if not agent_membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned agent does not belong to this agency",
            )

    # Duplicate submission prevention
    clean_phone = data.phone.strip()
    existing_lead = (
        db.query(Lead)
        .filter(
            Lead.agency_id == tenant.agency_id,
            Lead.phone == clean_phone,
            Lead.is_archived == False,
        )
        .first()
    )
    if existing_lead:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A lead with phone '{clean_phone}' already exists: {existing_lead.full_name} ({existing_lead.status}).",
        )

    new_lead = Lead(
        agency_id=tenant.agency_id,
        full_name=data.full_name.strip(),
        phone=clean_phone,
        email=data.email.strip() if data.email else None,
        city=data.city,
        source=data.source,
        status=data.status,
        priority=data.priority,
        budget_pkr=data.budget_pkr,
        property_type_interest=data.property_type_interest,
        preferred_locations=data.preferred_locations,
        purpose=data.purpose,
        assigned_agent_id=assigned_agent_id,
        next_followup_at=data.next_followup_at,
        created_by_id=tenant.user.id,
        updated_by_id=tenant.user.id,
    )
    db.add(new_lead)
    db.flush()

    # Log initial activity
    activity = LeadActivity(
        agency_id=tenant.agency_id,
        lead_id=new_lead.id,
        user_id=tenant.user.id,
        performed_by_name=tenant.user.full_name,
        type="creation",
        title="Lead Created",
        description=f"Lead recorded from {data.source} with budget Rs. {data.budget_pkr:,.0f}",
    )
    db.add(activity)

    if data.initial_note:
        note = LeadNote(
            agency_id=tenant.agency_id,
            lead_id=new_lead.id,
            user_id=tenant.user.id,
            author_name=tenant.user.full_name,
            content=data.initial_note,
        )
        db.add(note)

    if assigned_agent_id:
        assignment = LeadAssignment(
            agency_id=tenant.agency_id,
            lead_id=new_lead.id,
            agent_id=assigned_agent_id,
            assigned_by_id=tenant.user.id,
        )
        db.add(assignment)
        # Notify the assigned agent
        NotificationService.notify_lead_assigned(
            db=db,
            agency_id=tenant.agency_id,
            lead=new_lead,
            assigned_agent_id=assigned_agent_id,
            assigned_by_name=tenant.user.full_name,
        )

    db.commit()
    db.refresh(new_lead)

    # Decoupled outbound automation trigger (e.g. n8n webhook)
    try:
        AutomationService.trigger_lead_created_workflow(
            db=db,
            agency=tenant.agency,
            lead=new_lead,
        )
    except Exception as exc:
        logger.error("Outbound automation trigger error for lead %s: %s", new_lead.id, exc)

    return _format_lead(new_lead)


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: str,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .options(
            joinedload(Lead.assigned_agent),
            joinedload(Lead.created_by),
            joinedload(Lead.updated_by),
            joinedload(Lead.notes),
            joinedload(Lead.activities),
            joinedload(Lead.associated_properties).joinedload(LeadPropertyAssociation.property),
        )
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    # RBAC: Sales agent can only view their own assigned leads
    if tenant.is_agent and lead.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You only have permission to view leads assigned to you.",
        )

    return _format_lead(lead)


@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: str,
    data: LeadUpdate,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    # RBAC: Sales agent can only edit their own assigned leads
    if tenant.is_agent and lead.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You only have permission to update leads assigned to you.",
        )

    old_status = lead.status
    old_agent_id = lead.assigned_agent_id
    old_archived = lead.is_archived

    update_dict = data.model_dump(exclude_unset=True)

    # RBAC: Agents cannot reassign leads!
    if "assigned_agent_id" in update_dict and update_dict["assigned_agent_id"] != old_agent_id:
        if tenant.is_agent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden. Only managers and owners can reassign leads.",
            )

        new_agent_id = update_dict["assigned_agent_id"]
        if new_agent_id:
            agent_membership = (
                db.query(AgencyMembership)
                .filter(
                    AgencyMembership.agency_id == tenant.agency_id,
                    AgencyMembership.user_id == new_agent_id,
                )
                .first()
            )
            if not agent_membership:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assigned agent does not belong to this agency",
                )

    for key, value in update_dict.items():
        setattr(lead, key, value)

    # Status change activity log
    if "status" in update_dict and update_dict["status"] != old_status:
        activity = LeadActivity(
            agency_id=tenant.agency_id,
            lead_id=lead.id,
            user_id=tenant.user.id,
            performed_by_name=tenant.user.full_name,
            type="status_change",
            title="Lead Status Updated",
            description=f"Status changed from '{old_status}' to '{lead.status}'",
        )
        db.add(activity)

    # Reassignment activity log
    if "assigned_agent_id" in update_dict and update_dict["assigned_agent_id"] != old_agent_id:
        agent_user = db.query(User).filter(User.id == lead.assigned_agent_id).first()
        agent_name = agent_user.full_name if agent_user else "unassigned"
        activity = LeadActivity(
            agency_id=tenant.agency_id,
            lead_id=lead.id,
            user_id=tenant.user.id,
            performed_by_name=tenant.user.full_name,
            type="assignment",
            title="Lead Reassigned",
            description=f"Lead assigned to {agent_name}",
        )
        db.add(activity)
        if lead.assigned_agent_id:
            db.add(
                LeadAssignment(
                    agency_id=tenant.agency_id,
                    lead_id=lead.id,
                    agent_id=lead.assigned_agent_id,
                    assigned_by_id=tenant.user.id,
                )
            )
            NotificationService.notify_lead_assigned(
                db=db,
                agency_id=tenant.agency_id,
                lead=lead,
                assigned_agent_id=lead.assigned_agent_id,
                assigned_by_name=tenant.user.full_name,
            )

    # Archive / Unarchive activity log
    if "is_archived" in update_dict and update_dict["is_archived"] != old_archived:
        action_label = "Archived" if lead.is_archived else "Restored from Archive"
        activity = LeadActivity(
            agency_id=tenant.agency_id,
            lead_id=lead.id,
            user_id=tenant.user.id,
            performed_by_name=tenant.user.full_name,
            type="archive" if lead.is_archived else "restore",
            title=f"Lead {action_label}",
            description=f"Lead {action_label.lower()} by {tenant.user.full_name}",
        )
        db.add(activity)

    lead.updated_by_id = tenant.user.id

    db.commit()
    db.refresh(lead)

    return _format_lead(lead)


@router.post("/{lead_id}/archive", response_model=LeadResponse)
def archive_lead(
    lead_id: str,
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )
    lead.is_archived = True
    lead.updated_by_id = tenant.user.id
    db.add(
        LeadActivity(
            agency_id=tenant.agency_id,
            lead_id=lead.id,
            user_id=tenant.user.id,
            performed_by_name=tenant.user.full_name,
            type="archive",
            title="Lead Archived",
            description=f"Lead archived by {tenant.user.full_name}",
        )
    )
    db.commit()
    db.refresh(lead)
    return _format_lead(lead)


@router.post("/{lead_id}/unarchive", response_model=LeadResponse)
def unarchive_lead(
    lead_id: str,
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )
    lead.is_archived = False
    lead.updated_by_id = tenant.user.id
    db.add(
        LeadActivity(
            agency_id=tenant.agency_id,
            lead_id=lead.id,
            user_id=tenant.user.id,
            performed_by_name=tenant.user.full_name,
            type="restore",
            title="Lead Restored",
            description=f"Lead restored to active pipeline by {tenant.user.full_name}",
        )
    )
    db.commit()
    db.refresh(lead)
    return _format_lead(lead)


@router.get("/{lead_id}/properties", response_model=List[LeadPropertyAssociationResponse])
def get_lead_associated_properties(
    lead_id: str,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    if tenant.is_agent and lead.assigned_agent_id != tenant.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    assocs = (
        db.query(LeadPropertyAssociation)
        .options(joinedload(LeadPropertyAssociation.property))
        .filter(LeadPropertyAssociation.lead_id == lead_id, LeadPropertyAssociation.agency_id == tenant.agency_id)
        .all()
    )
    return [
        {
            "id": a.id,
            "property_id": a.property_id,
            "property_title": a.property.title if a.property else "Property",
            "property_location": a.property.location if a.property else "",
            "property_society": a.property.society if a.property else "",
            "property_price_pkr": a.property.price_pkr if a.property else 0,
            "property_type": a.property.type if a.property else "",
            "property_image_url": a.property.image_url if a.property else None,
            "notes": a.notes,
            "created_at": a.created_at,
        }
        for a in assocs
        if a.property
    ]


@router.post("/{lead_id}/properties", response_model=LeadPropertyAssociationResponse, status_code=status.HTTP_201_CREATED)
def associate_property_with_lead(
    lead_id: str,
    data: LeadPropertyAssociationCreate,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    if tenant.is_agent and lead.assigned_agent_id != tenant.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    prop = (
        db.query(Property)
        .filter(Property.id == data.property_id, Property.agency_id == tenant.agency_id)
        .first()
    )
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found in this agency")

    existing = (
        db.query(LeadPropertyAssociation)
        .filter(
            LeadPropertyAssociation.lead_id == lead_id,
            LeadPropertyAssociation.property_id == data.property_id,
            LeadPropertyAssociation.agency_id == tenant.agency_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Property is already associated with this lead")

    assoc = LeadPropertyAssociation(
        agency_id=tenant.agency_id,
        lead_id=lead_id,
        property_id=data.property_id,
        notes=data.notes,
    )
    db.add(assoc)

    db.add(
        LeadActivity(
            agency_id=tenant.agency_id,
            lead_id=lead_id,
            user_id=tenant.user.id,
            performed_by_name=tenant.user.full_name,
            type="property_link",
            title="Property Associated",
            description=f"Linked property: {prop.title} ({prop.society})",
        )
    )

    db.commit()
    db.refresh(assoc)

    return {
        "id": assoc.id,
        "property_id": assoc.property_id,
        "property_title": prop.title,
        "property_location": prop.location,
        "property_society": prop.society,
        "property_price_pkr": prop.price_pkr,
        "property_type": prop.type,
        "property_image_url": prop.image_url,
        "notes": assoc.notes,
        "created_at": assoc.created_at,
    }


@router.delete("/{lead_id}/properties/{property_id}", response_model=MessageResponse)
def remove_property_association(
    lead_id: str,
    property_id: str,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    if tenant.is_agent and lead.assigned_agent_id != tenant.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    assoc = (
        db.query(LeadPropertyAssociation)
        .filter(
            LeadPropertyAssociation.lead_id == lead_id,
            LeadPropertyAssociation.property_id == property_id,
            LeadPropertyAssociation.agency_id == tenant.agency_id,
        )
        .first()
    )
    if not assoc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Association not found")

    db.delete(assoc)
    db.commit()
    return MessageResponse(message="Property unlinked successfully")


@router.delete("/{lead_id}", response_model=MessageResponse)
def delete_lead(
    lead_id: str,
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    # Only managers and owners can delete leads
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    db.delete(lead)
    db.commit()
    return MessageResponse(message="Lead deleted successfully")


@router.post("/{lead_id}/assign", response_model=LeadResponse)
def assign_lead(
    lead_id: str,
    req: LeadAssignRequest,
    tenant: TenantContext = Depends(require_manager),
    db: Session = Depends(get_db),
):
    # Only managers and owners can reassign leads
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    agent_membership = (
        db.query(AgencyMembership)
        .filter(
            AgencyMembership.agency_id == tenant.agency_id,
            AgencyMembership.user_id == req.agent_id,
        )
        .first()
    )
    if not agent_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent does not belong to this agency",
        )

    agent = db.query(User).filter(User.id == req.agent_id).first()
    lead.assigned_agent_id = req.agent_id

    assignment = LeadAssignment(
        agency_id=tenant.agency_id,
        lead_id=lead.id,
        agent_id=req.agent_id,
        assigned_by_id=tenant.user.id,
    )
    db.add(assignment)

    activity = LeadActivity(
        agency_id=tenant.agency_id,
        lead_id=lead.id,
        user_id=tenant.user.id,
        performed_by_name=tenant.user.full_name,
        type="assignment",
        title="Lead Reassigned",
        description=f"Assigned to {agent.full_name if agent else 'agent'}",
    )
    db.add(activity)

    NotificationService.notify_lead_assigned(
        db=db,
        agency_id=tenant.agency_id,
        lead=lead,
        assigned_agent_id=req.agent_id,
        assigned_by_name=tenant.user.full_name,
    )

    db.commit()
    db.refresh(lead)

    return _format_lead(lead)


@router.post("/{lead_id}/notes", response_model=LeadNoteResponse, status_code=status.HTTP_201_CREATED)
def add_lead_note(
    lead_id: str,
    data: LeadNoteCreate,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    # RBAC: Agent can only add notes to their assigned leads
    if tenant.is_agent and lead.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You only have permission to add notes to leads assigned to you.",
        )

    note = LeadNote(
        agency_id=tenant.agency_id,
        lead_id=lead.id,
        user_id=tenant.user.id,
        author_name=tenant.user.full_name,
        content=data.content,
    )
    db.add(note)

    activity = LeadActivity(
        agency_id=tenant.agency_id,
        lead_id=lead.id,
        user_id=tenant.user.id,
        performed_by_name=tenant.user.full_name,
        type="note",
        title="Note Added",
        description=data.content[:120] + ("..." if len(data.content) > 120 else ""),
    )
    db.add(activity)

    db.commit()
    db.refresh(note)

    return note


@router.post("/{lead_id}/activities", response_model=LeadActivityResponse, status_code=status.HTTP_201_CREATED)
def log_lead_activity(
    lead_id: str,
    data: LeadActivityCreate,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found",
        )

    # RBAC: Agent can only log activities for their assigned leads
    if tenant.is_agent and lead.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You only have permission to log activities for leads assigned to you.",
        )

    # Update last contacted time on call/meeting/whatsapp
    if data.type in ("call", "whatsapp", "meeting"):
        lead.last_contacted_at = datetime.now(timezone.utc)

    activity = LeadActivity(
        agency_id=tenant.agency_id,
        lead_id=lead.id,
        user_id=tenant.user.id,
        performed_by_name=tenant.user.full_name,
        type=data.type,
        title=data.title,
        description=data.description,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


@router.get("/{lead_id}/matches", response_model=LeadMatchesResponse)
def get_lead_property_matches(
    lead_id: str,
    min_score: int = Query(25, ge=0, le=100),
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    """
    Smart Property Matching Engine:
    Computes real-time match scores (0-100%) between this lead's requirements
    (budget, property type, preferred societies) and all available agency inventory.
    Generates pre-formatted 1-click WhatsApp pitch messages.
    """
    lead = (
        db.query(Lead)
        .options(joinedload(Lead.assigned_agent))
        .filter(Lead.id == lead_id, Lead.agency_id == tenant.agency_id)
        .first()
    )
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    # RBAC check: Agent can only view matches for their assigned leads
    if tenant.is_agent and lead.assigned_agent_id != tenant.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. You only have permission to view matches for leads assigned to you.",
        )

    # Fetch active properties in the agency
    properties = (
        db.query(Property)
        .filter(Property.agency_id == tenant.agency_id, Property.status == "available")
        .all()
    )

    agency_name = tenant.agency.name if tenant.agency else "Apex Properties Islamabad"
    agent_name = tenant.user.full_name

    matches = MatchingService.get_matches_for_lead(
        lead=lead,
        properties=properties,
        min_score=min_score,
        agent_name=agent_name,
        agency_name=agency_name,
    )

    return LeadMatchesResponse(
        lead_id=lead.id,
        lead_name=lead.full_name,
        budget_pkr=lead.budget_pkr,
        property_type=lead.property_type_interest,
        preferred_locations=lead.preferred_locations or "Islamabad",
        total_matches=len(matches),
        matches=matches,
    )
