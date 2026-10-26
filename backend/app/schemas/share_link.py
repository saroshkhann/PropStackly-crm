from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class CreateShareLinkRequest(BaseModel):
    property_id: Optional[str] = None
    lead_id: Optional[str] = None
    target_buyer_name: Optional[str] = None
    target_buyer_country: Optional[str] = "United Kingdom"
    target_buyer_city: Optional[str] = "London"
    target_buyer_phone: Optional[str] = None
    custom_pitch: Optional[str] = None
    default_currency: Optional[str] = "GBP"


class ShareLinkResponse(BaseModel):
    id: str
    property_id: str
    property_title: str
    lead_id: Optional[str] = None
    token: str
    share_url: str
    target_buyer_name: Optional[str] = None
    target_buyer_country: Optional[str] = None
    target_buyer_city: Optional[str] = None
    target_buyer_phone: Optional[str] = None
    custom_pitch: Optional[str] = None
    default_currency: str
    views_count: int
    last_viewed_at: Optional[datetime] = None
    created_at: datetime
    whatsapp_share_text: str


class PublicPropertyShareDossier(BaseModel):
    token: str
    property_id: str
    title: str
    slug: str
    type: str
    city: str
    location: str
    society: str
    price_pkr: float
    formatted_pkr: str
    currencies: Dict[str, Any]
    exchange_rates: Dict[str, Any]
    area_size: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    status: str
    featured: bool
    image_url: str
    gallery_images: List[str] = []
    description: str
    video_url: Optional[str] = None

    # Transparency & NOC status
    noc_status: str
    documents_verified: bool
    allotment_status: str
    possession_status: str
    legal_assurances: List[str] = []

    # Personalization
    target_buyer_name: Optional[str] = None
    target_buyer_country: Optional[str] = None
    target_buyer_city: Optional[str] = None
    custom_pitch: Optional[str] = None
    default_currency: str

    # Agent & Agency Details
    agent: Dict[str, Any]
    agency: Dict[str, Any]
    direct_whatsapp_url: str

    # Timezones for Virtual Tour Booking
    supported_timezones: List[Dict[str, Any]]


class BookVirtualTourRequest(BaseModel):
    client_name: str
    client_phone: str
    client_email: Optional[str] = None
    client_timezone: str = "Europe/London"
    visit_date: str = Field(..., description="YYYY-MM-DD")
    visit_time: str = Field(..., description="HH:MM in client's timezone or PKT")
    is_time_in_client_tz: bool = True
    platform: str = "whatsapp_video"
    notes: Optional[str] = None


class BookVirtualTourResponse(BaseModel):
    success: bool
    message: str
    site_visit_id: str
    visit_date: str
    client_local_time: str
    pkt_time: str
    platform: str
    invitation_text: str
    direct_whatsapp_url: str
