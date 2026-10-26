from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    role_title: Optional[str] = "Property Consultant"
    avatar_url: Optional[str] = None
    monthly_target_pkr: Optional[Decimal] = Decimal("80000000.00")



class UserCreate(UserBase):
    password: str
    role: str = "agent"  # admin, broker, agent


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role_title: Optional[str] = None
    avatar_url: Optional[str] = None
    monthly_target_pkr: Optional[Decimal] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    role: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentPerformanceResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    deals_closed: int
    revenue_pkr: Decimal
    target_pkr: Decimal
    active_leads: int
    conversion_rate: float
    status: str = "Active"
    system_role: Optional[str] = "agent"

    model_config = ConfigDict(from_attributes=True)
