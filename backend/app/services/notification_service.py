import logging
from typing import Optional, List, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.notification import Notification
from app.models.lead import Lead
from app.models.task import FollowUp
from app.models.agency import AgencyMembership
from app.services.broadcaster import notification_broadcaster

logger = logging.getLogger("propstackly.notifications")


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def format_utc_iso(dt: Optional[datetime]) -> str:
    """Format datetime with explicit timezone indicator (e.g. +00:00) so clients do not misinterpret as local time."""
    val = dt or get_utc_now()
    if val.tzinfo is None:
        val = val.replace(tzinfo=timezone.utc)
    return val.isoformat()


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        agency_id: str,
        user_id: str,
        title: str,
        message: str,
        type: str = "system",
        priority: str = "normal",
        link_url: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        deduplication_key: Optional[str] = None,
    ) -> Optional[Notification]:
        """
        Creates an in-app notification with deduplication support.
        If a notification with the same deduplication_key already exists for this agency,
        returns the existing notification to prevent duplicate spam.
        """
        if deduplication_key:
            existing = (
                db.query(Notification)
                .filter(
                    Notification.agency_id == agency_id,
                    Notification.deduplication_key == deduplication_key,
                )
                .first()
            )
            if existing:
                logger.debug(
                    "Skipping duplicate notification: deduplication_key=%s (agency_id=%s, user_id=%s)",
                    deduplication_key,
                    agency_id,
                    user_id,
                )
                return None

        notif = Notification(
            agency_id=agency_id,
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            priority=priority,
            link_url=link_url,
            entity_type=entity_type,
            entity_id=entity_id,
            deduplication_key=deduplication_key,
            is_read=False,
            created_at=get_utc_now(),
        )
        db.add(notif)
        db.flush()

        # Real-time event push payload
        payload = {
            "id": notif.id,
            "title": notif.title,
            "message": notif.message,
            "type": notif.type,
            "priority": notif.priority,
            "link_url": notif.link_url,
            "entity_type": notif.entity_type,
            "entity_id": notif.entity_id,
            "is_read": False,
            "created_at": format_utc_iso(notif.created_at),
        }
        notification_broadcaster.publish_to_user_sync(user_id, payload)

        logger.info(
            "Notification created & real-time pushed: title='%s', type='%s', user_id=%s, agency_id=%s",
            title,
            type,
            user_id,
            agency_id,
        )
        return notif

    @staticmethod
    def notify_lead_assigned(
        db: Session,
        agency_id: str,
        lead: Lead,
        assigned_agent_id: str,
        assigned_by_name: Optional[str] = None,
    ) -> Optional[Notification]:
        """
        Notifies an assigned agent when a lead is assigned or reassigned to them.
        """
        if not assigned_agent_id:
            return None

        # Build informative content
        budget_str = f"Rs. {float(lead.budget_pkr):,.0f}" if lead.budget_pkr else "Unspecified"
        locations = lead.preferred_locations or "Islamabad/Rawalpindi"
        by_text = f" by {assigned_by_name}" if assigned_by_name else ""

        title = f"New Lead Assigned: {lead.full_name}"
        message = (
            f"You have been assigned lead '{lead.full_name}'{by_text}. "
            f"Budget: {budget_str} | Interest: {lead.property_type_interest} in {locations}. "
            f"Phone: {lead.phone}."
        )

        dedup = f"lead_assigned_{lead.id}_{assigned_agent_id}"

        return NotificationService.create_notification(
            db=db,
            agency_id=agency_id,
            user_id=assigned_agent_id,
            title=title,
            message=message,
            type="lead_assigned",
            priority="high",
            link_url=f"/leads/{lead.id}",
            entity_type="lead",
            entity_id=lead.id,
            deduplication_key=dedup,
        )

    @staticmethod
    def notify_followup_reminder(
        db: Session,
        agency_id: str,
        followup: FollowUp,
        is_overdue: bool = False,
        reminder_window: Optional[str] = None,
    ) -> Optional[Notification]:
        """
        Sends an upcoming or overdue follow-up reminder to the responsible agent.
        """
        target_user_id = followup.assigned_agent_id

        # If follow-up has no agent assigned, fallback to agency admin/manager
        if not target_user_id:
            manager_membership = (
                db.query(AgencyMembership)
                .filter(
                    AgencyMembership.agency_id == agency_id,
                    AgencyMembership.role.in_(["owner", "manager", "broker", "admin"]),
                    AgencyMembership.is_active == True,
                )
                .first()
            )
            if manager_membership:
                target_user_id = manager_membership.user_id
            else:
                logger.warning(
                    "Cannot deliver follow-up reminder: No agent or manager for followup_id=%s",
                    followup.id,
                )
                return None

        lead_name = followup.lead.full_name if followup.lead else "Client"
        lead_phone = followup.lead.phone if followup.lead else ""

        if is_overdue:
            title = f"Overdue Follow-up: {lead_name}"
            message = (
                f"Follow-up was scheduled for {followup.scheduled_date} at {followup.scheduled_time} ({followup.type}). "
                f"Client: {lead_phone}. Notes: {followup.notes[:120]}."
            )
            dedup = f"followup_overdue_{followup.id}_{followup.scheduled_date}"
            notif_type = "followup_overdue"
            priority = "urgent"
        else:
            window_text = f" ({reminder_window})" if reminder_window else ""
            title = f"Upcoming Follow-up: {lead_name}{window_text}"
            message = (
                f"Follow-up scheduled today at {followup.scheduled_time} ({followup.type}). "
                f"Client: {lead_phone}. Notes: {followup.notes[:120]}."
            )
            dedup = f"followup_upcoming_{followup.id}_{followup.scheduled_date}_{followup.scheduled_time}"
            notif_type = "followup_upcoming"
            priority = "high"

        return NotificationService.create_notification(
            db=db,
            agency_id=agency_id,
            user_id=target_user_id,
            title=title,
            message=message,
            type=notif_type,
            priority=priority,
            link_url=f"/leads/{followup.lead_id}",
            entity_type="follow_up",
            entity_id=followup.id,
            deduplication_key=dedup,
        )

    @staticmethod
    def get_user_notifications(
        db: Session,
        agency_id: str,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Notification], int, int]:
        """
        Retrieves user-scoped notifications with total count and unread count.
        """
        base_query = db.query(Notification).filter(
            Notification.agency_id == agency_id,
            Notification.user_id == user_id,
        )

        unread_count = base_query.filter(Notification.is_read == False).count()

        query = base_query
        if unread_only:
            query = query.filter(Notification.is_read == False)

        total = query.count()
        notifications = (
            query.order_by(desc(Notification.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return notifications, total, unread_count

    @staticmethod
    def get_unread_count(db: Session, agency_id: str, user_id: str) -> int:
        return (
            db.query(func.count(Notification.id))
            .filter(
                Notification.agency_id == agency_id,
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .scalar()
            or 0
        )

    @staticmethod
    def mark_as_read(
        db: Session,
        agency_id: str,
        user_id: str,
        notification_id: str,
    ) -> Optional[Notification]:
        notif = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.agency_id == agency_id,
                Notification.user_id == user_id,
            )
            .first()
        )
        if notif and not notif.is_read:
            notif.is_read = True
            notif.read_at = get_utc_now()
            db.commit()
            db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_read(db: Session, agency_id: str, user_id: str) -> int:
        now = get_utc_now()
        count = (
            db.query(Notification)
            .filter(
                Notification.agency_id == agency_id,
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .update(
                {"is_read": True, "read_at": now},
                synchronize_session="fetch",
            )
        )
        db.commit()
        return count

    @staticmethod
    def delete_notification(
        db: Session,
        agency_id: str,
        user_id: str,
        notification_id: str,
    ) -> bool:
        notif = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.agency_id == agency_id,
                Notification.user_id == user_id,
            )
            .first()
        )
        if not notif:
            return False
        db.delete(notif)
        db.commit()
        return True
