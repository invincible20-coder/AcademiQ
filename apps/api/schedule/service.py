import uuid
from datetime import datetime, timezone
from typing import Optional, Sequence
from fastapi import HTTPException
from database.models import ScheduleEvent, EventType
from .schemas import ScheduleCreate, ScheduleUpdate
from .repository import ScheduleRepository

class ScheduleService:
    def __init__(self, repository: ScheduleRepository):
        self.repository = repository

    async def get_event(self, event_id: uuid.UUID, user_id: uuid.UUID) -> ScheduleEvent:
        event = await self.repository.get_by_id(event_id, user_id)
        if not event:
            raise HTTPException(status_code=404, detail="Schedule event not found")
        return event

    async def list_events(
        self,
        user_id: uuid.UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        course_id: Optional[uuid.UUID] = None,
        event_type: Optional[EventType] = None
    ) -> Sequence[ScheduleEvent]:
        events = await self.repository.list_events(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            course_id=course_id,
            event_type=event_type
        )
        
        if not start_date or not end_date:
            return events
            
        from dateutil.rrule import rrulestr
        from copy import copy
        from datetime import timedelta
        
        expanded_events = []
        for event in events:
            if event.is_recurring and event.rrule:
                try:
                    rule = rrulestr(event.rrule, dtstart=event.start_time.replace(tzinfo=None))
                    duration = event.end_time - event.start_time
                    # Get occurrences within the window
                    for dt in rule.between(start_date.replace(tzinfo=None), end_date.replace(tzinfo=None), inc=True):
                        # Add timezone awareness back
                        start_tz = dt.replace(tzinfo=timezone.utc)
                        end_tz = start_tz + duration
                        
                        # Create transient copy
                        expanded = copy(event)
                        expanded.start_time = start_tz
                        expanded.end_time = end_tz
                        expanded_events.append(expanded)
                except Exception as e:
                    # Fallback to original if parsing fails
                    expanded_events.append(event)
            else:
                expanded_events.append(event)
                
        # Sort all events chronologically
        expanded_events.sort(key=lambda x: x.start_time)
        return expanded_events

    async def create_event(self, data: ScheduleCreate, user_id: uuid.UUID) -> ScheduleEvent:
        if data.start_time >= data.end_time:
            raise HTTPException(status_code=400, detail="Start time must be before end time")
            
        event = ScheduleEvent(
            user_id=user_id,
            **data.model_dump()
        )
        return await self.repository.create(event)

    async def update_event(self, event_id: uuid.UUID, data: ScheduleUpdate, user_id: uuid.UUID) -> ScheduleEvent:
        event = await self.get_event(event_id, user_id)
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Check start < end if either is updated
        new_start = update_data.get("start_time", event.start_time)
        new_end = update_data.get("end_time", event.end_time)
        
        if new_start and new_end and new_start >= new_end:
            raise HTTPException(status_code=400, detail="Start time must be before end time")
            
        for key, value in update_data.items():
            setattr(event, key, value)
            
        return await self.repository.update(event)

    async def delete_event(self, event_id: uuid.UUID, user_id: uuid.UUID) -> None:
        event = await self.get_event(event_id, user_id)
        event.deleted_at = datetime.now(timezone.utc)
        await self.repository.update(event)

    async def duplicate_event(self, event_id: uuid.UUID, user_id: uuid.UUID) -> ScheduleEvent:
        event = await self.get_event(event_id, user_id)
        new_event = ScheduleEvent(
            user_id=event.user_id,
            course_id=event.course_id,
            title=f"{event.title} (Copy)",
            description=event.description,
            event_type=event.event_type,
            location=event.location,
            start_time=event.start_time,
            end_time=event.end_time,
            is_all_day=event.is_all_day,
            is_recurring=event.is_recurring,
            recurrence_rule=event.recurrence_rule,
            color_theme=event.color_theme,
        )
        return await self.repository.create(new_event)
