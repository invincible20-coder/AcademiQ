import uuid
from typing import Optional, Sequence
from datetime import datetime
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import ScheduleEvent, EventType

class ScheduleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, event_id: uuid.UUID, user_id: uuid.UUID) -> Optional[ScheduleEvent]:
        result = await self.db.execute(
            select(ScheduleEvent).where(
                ScheduleEvent.id == event_id,
                ScheduleEvent.user_id == user_id,
                ScheduleEvent.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def list_events(
        self,
        user_id: uuid.UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        course_id: Optional[uuid.UUID] = None,
        event_type: Optional[EventType] = None
    ) -> Sequence[ScheduleEvent]:
        query = select(ScheduleEvent).where(
            ScheduleEvent.user_id == user_id,
            ScheduleEvent.deleted_at.is_(None)
        )

        if start_date and end_date:
            query = query.where(
                or_(
                    and_(ScheduleEvent.start_time >= start_date, ScheduleEvent.start_time <= end_date),
                    and_(ScheduleEvent.end_time >= start_date, ScheduleEvent.end_time <= end_date),
                    and_(ScheduleEvent.start_time <= start_date, ScheduleEvent.end_time >= end_date),
                    ScheduleEvent.is_recurring == True
                )
            )

        if course_id:
            query = query.where(ScheduleEvent.course_id == course_id)

        if event_type:
            query = query.where(ScheduleEvent.event_type == event_type)

        query = query.order_by(ScheduleEvent.start_time)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create(self, event: ScheduleEvent) -> ScheduleEvent:
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def update(self, event: ScheduleEvent) -> ScheduleEvent:
        await self.db.commit()
        await self.db.refresh(event)
        return event
