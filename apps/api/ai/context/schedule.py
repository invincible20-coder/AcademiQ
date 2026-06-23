import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from database.models import ScheduleEvent
from dateutil.rrule import rrulestr

async def get_schedule_context(db: AsyncSession, user_id: uuid.UUID) -> str:
    now = datetime.now(timezone.utc)
    next_week = now + timedelta(days=7)
    
    result = await db.execute(
        select(ScheduleEvent).where(
            ScheduleEvent.user_id == user_id,
            ScheduleEvent.deleted_at.is_(None)
        )
    )
    events = result.scalars().all()
    
    upcoming = []
    
    for event in events:
        if not event.is_recurring:
            # Check if event is within the next 7 days
            if now <= event.start_time <= next_week:
                upcoming.append(event)
        else:
            if event.recurrence_rule:
                try:
                    rrule_obj = rrulestr(event.recurrence_rule)
                    occurrences = rrule_obj.between(now.replace(tzinfo=None), next_week.replace(tzinfo=None), True)
                    if occurrences:
                        upcoming.append(event)
                except Exception:
                    pass

    if not upcoming:
        return "No upcoming schedule events in the next 7 days."
        
    lines = ["Upcoming Schedule (Next 7 Days):"]
    for e in upcoming[:10]: # Limit to 10 contextually
        lines.append(f"- [{e.event_type.value}] {e.title}")
        
    return "\n".join(lines)
