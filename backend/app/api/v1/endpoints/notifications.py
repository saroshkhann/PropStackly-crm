import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_tenant_context, TenantContext
from app.services.notification_service import NotificationService
from app.services.broadcaster import notification_broadcaster
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationCountResponse,
)
from app.schemas.common import MessageResponse

router = APIRouter()


@router.get("/stream")
async def stream_notifications(
    request: Request,
    tenant: TenantContext = Depends(get_tenant_context),
):
    """
    Real-Time Server-Sent Events (SSE) notification stream.
    Pushes instant alerts to the agent's screen (lead assigned, follow-up overdue, deal stage advances).
    """
    async def event_generator():
        queue = await notification_broadcaster.register(tenant.user_id, tenant.agency_id)
        try:
            connect_payload = json.dumps({
                "type": "connected",
                "user_id": tenant.user_id,
                "agency_id": tenant.agency_id,
                "message": "Real-time notification stream active",
            })
            yield f"event: connected\ndata: {connect_payload}\n\n"

            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"event: notification\ndata: {json.dumps(data)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            await notification_broadcaster.unregister(tenant.user_id, tenant.agency_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/test-push", response_model=NotificationResponse)
def test_push_notification(
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    """
    Test endpoint to simulate an instant real-time lead assignment push notification.
    """
    title = "Real-Time Alert: New High-Value Lead"
    message = "Assigned: Chaudhry Zafar (+92 300 8594012) - 1 Kanal Corner Villa in DHA Phase 2 (Budget: PKR 7.8 Cr)."
    notif = NotificationService.create_notification(
        db=db,
        agency_id=tenant.agency_id,
        user_id=tenant.user_id,
        title=title,
        message=message,
        type="lead_assigned",
        priority="high",
        link_url="/leads",
        entity_type="lead",
    )
    db.commit()
    return NotificationResponse.model_validate(notif)


@router.get("", response_model=NotificationListResponse)
def get_notifications(
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    """
    List in-app notifications for the authenticated user, strictly scoped to their agency.
    """
    items, total, unread_count = NotificationService.get_user_notifications(
        db=db,
        agency_id=tenant.agency_id,
        user_id=tenant.user_id,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(item) for item in items],
        total=total,
        unread_count=unread_count,
    )


@router.get("/unread-count", response_model=NotificationCountResponse)
def get_unread_count(
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    """
    Fast endpoint returning the unread notification count for the topbar badge.
    """
    count = NotificationService.get_unread_count(
        db=db,
        agency_id=tenant.agency_id,
        user_id=tenant.user_id,
    )
    return NotificationCountResponse(unread_count=count)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: str,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    """
    Mark a single notification as read.
    """
    notif = NotificationService.mark_as_read(
        db=db,
        agency_id=tenant.agency_id,
        user_id=tenant.user_id,
        notification_id=notification_id,
    )
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return NotificationResponse.model_validate(notif)


@router.post("/mark-all-read")
def mark_all_notifications_read(
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    """
    Mark all unread notifications for the authenticated user as read.
    """
    count = NotificationService.mark_all_read(
        db=db,
        agency_id=tenant.agency_id,
        user_id=tenant.user_id,
    )
    return {"count": count, "message": f"Marked {count} notifications as read."}


@router.delete("/{notification_id}", response_model=MessageResponse)
def delete_notification(
    notification_id: str,
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
):
    """
    Dismiss or delete a notification.
    """
    success = NotificationService.delete_notification(
        db=db,
        agency_id=tenant.agency_id,
        user_id=tenant.user_id,
        notification_id=notification_id,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return MessageResponse(message="Notification deleted successfully")
