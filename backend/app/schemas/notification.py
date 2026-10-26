from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, field_serializer


class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "system"
    priority: str = "normal"
    link_url: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None


class NotificationResponse(NotificationBase):
    id: str
    agency_id: str
    user_id: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    @field_serializer("read_at")
    def serialize_read_at(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int


class NotificationCountResponse(BaseModel):
    unread_count: int
