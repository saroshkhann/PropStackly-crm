import asyncio
import json
import logging
from typing import Dict, Set, Any

logger = logging.getLogger("propstackly.broadcaster")


class NotificationBroadcaster:
    """
    In-memory real-time push event broadcaster for Server-Sent Events (SSE).
    Maintains subscriber queues per user and per agency.
    """

    def __init__(self):
        # user_id -> Set[asyncio.Queue]
        self._user_queues: Dict[str, Set[asyncio.Queue]] = {}
        # agency_id -> Set[asyncio.Queue]
        self._agency_queues: Dict[str, Set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()
        self._main_loop: asyncio.AbstractEventLoop | None = None

    async def register(self, user_id: str, agency_id: str) -> asyncio.Queue:
        self._main_loop = asyncio.get_running_loop()
        queue = asyncio.Queue(maxsize=100)
        async with self._lock:
            if user_id not in self._user_queues:
                self._user_queues[user_id] = set()
            self._user_queues[user_id].add(queue)

            if agency_id not in self._agency_queues:
                self._agency_queues[agency_id] = set()
            self._agency_queues[agency_id].add(queue)

            logger.info(
                "SSE client registered for user %s, agency %s (user connections: %d)",
                user_id,
                agency_id,
                len(self._user_queues[user_id]),
            )
        return queue

    async def unregister(self, user_id: str, agency_id: str, queue: asyncio.Queue):
        async with self._lock:
            if user_id in self._user_queues:
                self._user_queues[user_id].discard(queue)
                if not self._user_queues[user_id]:
                    del self._user_queues[user_id]

            if agency_id in self._agency_queues:
                self._agency_queues[agency_id].discard(queue)
                if not self._agency_queues[agency_id]:
                    del self._agency_queues[agency_id]

            logger.info("SSE client disconnected for user %s", user_id)

    def publish_to_user_sync(self, user_id: str, payload: dict):
        """
        Thread-safe synchronous publishing method suitable for calling inside
        standard SQLAlchemy database transaction blocks.
        """
        try:
            if self._main_loop and self._main_loop.is_running():
                asyncio.run_coroutine_threadsafe(self.publish_to_user(user_id, payload), self._main_loop)
                return
            loop = asyncio.get_running_loop()
            loop.create_task(self.publish_to_user(user_id, payload))
        except RuntimeError:
            try:
                if self._main_loop and self._main_loop.is_running():
                    asyncio.run_coroutine_threadsafe(self.publish_to_user(user_id, payload), self._main_loop)
            except Exception as exc:
                logger.debug("Broadcaster threadsafe dispatch failed: %s", exc)

    async def publish_to_user(self, user_id: str, payload: dict):
        if user_id not in self._user_queues:
            return

        queues = list(self._user_queues[user_id])
        logger.info("Broadcasting real-time event to user %s (%d active streams)", user_id, len(queues))
        for q in queues:
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                logger.warning("Queue full for user %s, dropping event", user_id)
            except Exception as exc:
                logger.error("Failed to enqueue event for user %s: %s", user_id, exc)

    def publish_to_agency_sync(self, agency_id: str, payload: dict):
        try:
            if self._main_loop and self._main_loop.is_running():
                asyncio.run_coroutine_threadsafe(self.publish_to_agency(agency_id, payload), self._main_loop)
                return
            loop = asyncio.get_running_loop()
            loop.create_task(self.publish_to_agency(agency_id, payload))
        except RuntimeError:
            if self._main_loop and self._main_loop.is_running():
                asyncio.run_coroutine_threadsafe(self.publish_to_agency(agency_id, payload), self._main_loop)

    async def publish_to_agency(self, agency_id: str, payload: dict):
        if agency_id not in self._agency_queues:
            return

        queues = list(self._agency_queues[agency_id])
        logger.info("Broadcasting real-time event to agency %s (%d active streams)", agency_id, len(queues))
        for q in queues:
            try:
                q.put_nowait(payload)
            except Exception as exc:
                logger.error("Failed to enqueue agency event: %s", exc)


notification_broadcaster = NotificationBroadcaster()
