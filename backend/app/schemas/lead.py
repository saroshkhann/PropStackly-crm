from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LeadNoteBase(BaseModel):
    content: str


class LeadNoteCreate(LeadNoteBase):
    pass


class LeadNoteResponse(LeadNoteBase):
    id: str
    lead_id: str
    author_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadActivityBase(BaseModel):
    type: str  # call, whatsapp, meeting, site_visit, note, status_change
    title: str
    description: str


class LeadActivityCreate(LeadActivityBase):
    pass


class LeadActivityResponse(LeadActivityBase):
    id: str
    lead_id: str
    performed_by_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadPropertyAssociationCreate(BaseModel):
    property_id: str
    notes: Optional[str] = None


class LeadPropertyAssociationResponse(BaseModel):
    id: str
    property_id: str
    property_title: str
    property_location: str
    property_society: str
    property_price_pkr: Decimal
    property_type: str
    property_image_url: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    city: str = "Islamabad"
    source: str = "Facebook Ads"
    status: str = "new"  # new, contacted, qualified, site_visit_scheduled, negotiation, won, lost
    priority: str = "high"
    budget_pkr: Decimal = Decimal("0.00")
    property_type_interest: str = "House / Villa"
    preferred_locations: str = "DHA Islamabad Phase 2"
    purpose: str = "Own Residence"
    assigned_agent_id: Optional[str] = None
    next_followup_at: Optional[datetime] = None
    is_archived: bool = False


class LeadCreate(LeadBase):
    initial_note: Optional[str] = None


class LeadUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    budget_pkr: Optional[Decimal] = None
    property_type_interest: Optional[str] = None
    preferred_locations: Optional[str] = None
    purpose: Optional[str] = None
    assigned_agent_id: Optional[str] = None
    last_contacted_at: Optional[datetime] = None
    next_followup_at: Optional[datetime] = None
    is_archived: Optional[bool] = None


class LeadResponse(LeadBase):
    id: str
    agency_id: str
    assigned_agent_name: Optional[str] = None
    created_by_id: Optional[str] = None
    created_by_name: Optional[str] = None
    updated_by_id: Optional[str] = None
    updated_by_name: Optional[str] = None
    last_contacted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    notes: Optional[List[LeadNoteResponse]] = []
    activities: Optional[List[LeadActivityResponse]] = []
    associated_properties: Optional[List[LeadPropertyAssociationResponse]] = []

    model_config = ConfigDict(from_attributes=True)


class LeadAssignRequest(BaseModel):
    agent_id: str


class MatchedPropertyItem(BaseModel):
    id: str
    title: str
    type: str
    location: str
    society: str
    city: str
    price_pkr: Decimal
    area_size: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    status: str
    image_url: Optional[str] = None
    match_score: int
    match_level: str  # "exceptional", "strong", "moderate"
    budget_fit: str  # "exact", "within_budget", "below_budget", "above_budget"
    budget_difference_pkr: Decimal
    reasons: List[str]
    whatsapp_pitch_text: str
    whatsapp_pitch_text_urdu: Optional[str] = None


class LeadMatchesResponse(BaseModel):
    lead_id: str
    lead_name: str
    budget_pkr: Decimal
    property_type: str
    preferred_locations: str
    total_matches: int
    matches: List[MatchedPropertyItem]
