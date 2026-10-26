from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FollowUpBase(BaseModel):
    lead_id: str
    assigned_agent_id: Optional[str] = None
    scheduled_date: str  # YYYY-MM-DD
    scheduled_time: str  # HH:MM
    type: str = "Phone Call"
    notes: str
    priority: str = "high"


class FollowUpCreate(FollowUpBase):
    pass


class FollowUpUpdate(BaseModel):
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None
    assigned_agent_id: Optional[str] = None


class FollowUpResponse(FollowUpBase):
    id: str
    agency_id: str
    completed: bool
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[str] = None
    completed_by_name: Optional[str] = None
    lead_name: Optional[str] = None
    lead_phone: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SiteVisitBase(BaseModel):
    lead_id: str
    property_id: str
    assigned_agent_id: Optional[str] = None
    visit_date: str  # YYYY-MM-DD
    visit_time: str  # HH:MM
    status: str = "scheduled"
    notes: Optional[str] = None
    client_feedback: Optional[str] = None


class SiteVisitCreate(SiteVisitBase):
    pass


class SiteVisitUpdate(BaseModel):
    visit_date: Optional[str] = None
    visit_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    client_feedback: Optional[str] = None
    assigned_agent_id: Optional[str] = None


class SiteVisitResponse(SiteVisitBase):
    id: str
    agency_id: str
    lead_name: Optional[str] = None
    lead_phone: Optional[str] = None
    property_title: Optional[str] = None
    property_location: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
