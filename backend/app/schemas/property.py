from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PropertyBase(BaseModel):
    title: str
    slug: Optional[str] = None
    type: str = "House / Villa"
    city: str = "Islamabad"
    location: str
    society: str
    price_pkr: Decimal = Decimal("0.00")
    area_size: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    status: str = "available"  # available, under_negotiation, sold, reserved
    featured: bool = False
    image_url: str
    description: str
    assigned_agent_id: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    type: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    society: Optional[str] = None
    price_pkr: Optional[Decimal] = None
    area_size: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    status: Optional[str] = None
    featured: Optional[bool] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    assigned_agent_id: Optional[str] = None


class PropertyResponse(PropertyBase):
    id: str
    agency_id: str
    assigned_agent_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PropertyBriefResponse(BaseModel):
    id: str
    title: str
    type: str
    location: str
    society: str
    price_pkr: Decimal
    area_size: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class PropertyImageUploadResponse(BaseModel):
    url: str
    filename: str
    size_bytes: int
