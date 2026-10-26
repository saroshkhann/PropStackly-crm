import asyncio
import logging
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import SessionLocal
from app.models.agency import Agency
from app.models.task import FollowUp
from app.services.notification_service import NotificationService

logger = logging.getLogger("propstackly.scheduler")


def get_current_utc() -> datetime:
    return datetime.now(timezone.utc)


def parse_followup_datetime(scheduled_date: str, scheduled_time: str) -> Optional[datetime]:
    """Parses date string (YYYY-MM-DD) and time string (HH:MM or HH:MM:SS) into a naive or UTC datetime."""
    try:
        clean_time = scheduled_time.strip()
        if len(clean_time) == 5:  # HH:MM
            time_fmt = "%Y-%m-%d %H:%M"
        else:
            time_fmt = "%Y-%m-%d %H:%M:%S"
        dt = datetime.strptime(f"{scheduled_date.strip()} {clean_time}", time_fmt)
        return dt.replace(tzinfo=timezone.utc)
    except Exception as exc:
        logger.debug("Could not parse datetime '%s %s': %s", scheduled_date, scheduled_time, exc)
        return None


def run_followup_reminders_job(db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Executes the scheduled follow-up reminder job across all active agencies.
    - Identifies upcoming follow-ups within each agency's configured reminder window.
    - Identifies overdue uncompleted follow-ups.
    - Emits in-app notifications with deduplication keys to prevent duplicate spam.
    - Safe error isolation: Failures in one agency do not crash the scheduler.
    """
    start_time = time.perf_counter()
    should_close_session = False
    if db is None:
        db = SessionLocal()
        should_close_session = True

    upcoming_count = 0
    overdue_count = 0
    agencies_count = 0

    try:
        now_utc = get_current_utc()
        today_str = now_utc.strftime("%Y-%m-%d")

        agencies = db.query(Agency).all()
        agencies_count = len(agencies)

        for agency in agencies:
            try:
                # Configurable reminder window: default 60 minutes
                reminder_minutes = agency.followup_reminder_minutes_before or 60
                lookahead_window = now_utc + timedelta(minutes=reminder_minutes)

                # Fetch uncompleted follow-ups for this agency
                followups = (
                    db.query(FollowUp)
                    .filter(
                        FollowUp.agency_id == agency.id,
                        FollowUp.completed == False,
                    )
                    .all()
                )

                for f in followups:
                    f_dt = parse_followup_datetime(f.scheduled_date, f.scheduled_time)
                    if not f_dt:
                        continue

                    # Overdue check: Scheduled time is in the past
                    if f_dt < now_utc:
                        notif = NotificationService.notify_followup_reminder(
                            db=db,
                            agency_id=agency.id,
                            followup=f,
                            is_overdue=True,
                        )
                        if notif:
                            overdue_count += 1

                    # Upcoming check: Scheduled time is between now and lookahead_window
                    elif now_utc <= f_dt <= lookahead_window:
                        diff_minutes = max(1, int((f_dt - now_utc).total_seconds() / 60))
                        window_text = f"in {diff_minutes} min" if diff_minutes < 60 else f"in {diff_minutes // 60}h"
                        notif = NotificationService.notify_followup_reminder(
                            db=db,
                            agency_id=agency.id,
                            followup=f,
                            is_overdue=False,
                            reminder_window=window_text,
                        )
                        if notif:
                            upcoming_count += 1

                db.commit()

            except Exception as agency_exc:
                db.rollback()
                logger.error(
                    "Error processing follow-up reminders for agency_id=%s: %s",
                    agency.id,
                    str(agency_exc),
                    exc_info=True,
                )

    finally:
        if should_close_session:
            db.close()

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    logger.info(
        "Follow-up reminder job completed: agencies=%d, upcoming_sent=%d, overdue_sent=%d, elapsed=%sms",
        agencies_count,
        upcoming_count,
        overdue_count,
        elapsed_ms,
    )

    return {
        "success": True,
        "agencies_processed": agencies_count,
        "upcoming_reminders_sent": upcoming_count,
        "overdue_reminders_sent": overdue_count,
        "elapsed_ms": elapsed_ms,
        "message": f"Processed {agencies_count} agencies. Sent {upcoming_count} upcoming and {overdue_count} overdue reminders.",
    }


class FollowupSchedulerWorker:
    """
    Background worker loop for periodic execution of follow-up reminders.
    Starts with FastAPI lifespan, wakes up on interval, handles exceptions safely.
    """
    def __init__(self, interval_seconds: int = 60):
        self.interval_seconds = interval_seconds
        self._is_running = False
        self._task: Optional[asyncio.Task] = None

    async def _loop(self):
        logger.info("FollowupSchedulerWorker background loop started (interval=%ds)", self.interval_seconds)
        while self._is_running:
            try:
                # Run the blocking database scan in a thread pool to avoid blocking the event loop
                await asyncio.to_thread(run_followup_reminders_job)
            except asyncio.CancelledError:
                logger.info("FollowupSchedulerWorker received cancellation.")
                break
            except Exception as exc:
                logger.error("Unexpected error in FollowupSchedulerWorker loop: %s", exc, exc_info=True)

            try:
                await asyncio.sleep(self.interval_seconds)
            except asyncio.CancelledError:
                break
        logger.info("FollowupSchedulerWorker background loop stopped.")

    def start(self):
        if not self._is_running:
            self._is_running = True
            self._task = asyncio.create_task(self._loop())

    async def stop(self):
        if self._is_running:
            self._is_running = False
            if self._task:
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass
                self._task = None


# Global scheduler worker instance
scheduler_worker = FollowupSchedulerWorker(interval_seconds=60)
