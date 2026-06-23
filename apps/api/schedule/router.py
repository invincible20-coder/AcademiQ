import uuid
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import User, EventType
from routers.deps import get_current_user

from .schemas import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from .repository import ScheduleRepository
from .service import ScheduleService

router = APIRouter()

def get_schedule_service(db: AsyncSession = Depends(get_db)) -> ScheduleService:
    repository = ScheduleRepository(db)
    return ScheduleService(repository)

@router.get("/", response_model=list[ScheduleResponse])
async def list_events(
    start_date: Optional[datetime] = Query(None, description="Start of date range (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="End of date range (ISO format)"),
    course_id: Optional[uuid.UUID] = Query(None),
    event_type: Optional[EventType] = Query(None),
    current_user: User = Depends(get_current_user),
    service: ScheduleService = Depends(get_schedule_service),
):
    return await service.list_events(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        course_id=course_id,
        event_type=event_type
    )

@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    body: ScheduleCreate,
    current_user: User = Depends(get_current_user),
    service: ScheduleService = Depends(get_schedule_service),
):
    return await service.create_event(body, current_user.id)

@router.get("/{event_id}", response_model=ScheduleResponse)
async def get_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ScheduleService = Depends(get_schedule_service),
):
    return await service.get_event(event_id, current_user.id)

@router.put("/{event_id}", response_model=ScheduleResponse)
async def update_event(
    event_id: uuid.UUID,
    body: ScheduleUpdate,
    current_user: User = Depends(get_current_user),
    service: ScheduleService = Depends(get_schedule_service),
):
    return await service.update_event(event_id, body, current_user.id)

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ScheduleService = Depends(get_schedule_service),
):
    await service.delete_event(event_id, current_user.id)

@router.patch("/{event_id}/duplicate", response_model=ScheduleResponse)
async def duplicate_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ScheduleService = Depends(get_schedule_service),
):
    return await service.duplicate_event(event_id, current_user.id)
