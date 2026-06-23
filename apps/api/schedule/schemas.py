import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from database.models import EventType

class ScheduleBase(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: Optional[uuid.UUID] = None
    event_type: EventType
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    color_theme: Optional[str] = None

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    course_id: Optional[uuid.UUID] = None
    event_type: Optional[EventType] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_all_day: Optional[bool] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None
    color_theme: Optional[str] = None

class ScheduleResponse(ScheduleBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
