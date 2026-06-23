"""Habits router — CRUD for habits and daily log entries."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from database.connection import get_db
from database.models import User, Habit, HabitLog, HabitFrequency
from routers.deps import get_current_user

router = APIRouter()


class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    frequency: HabitFrequency = HabitFrequency.daily
    target_days: Optional[list[int]] = None
    icon: Optional[str] = "✅"
    color: Optional[str] = "#7C3AED"


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[HabitFrequency] = None
    target_days: Optional[list[int]] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


class HabitLogCreate(BaseModel):
    date: date
    completed: bool = True
    note: Optional[str] = None


class HabitResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    frequency: HabitFrequency
    icon: Optional[str]
    color: Optional[str]
    is_active: bool

    model_config = {"from_attributes": True}


class HabitLogResponse(BaseModel):
    id: uuid.UUID
    habit_id: uuid.UUID
    date: date
    completed: bool
    note: Optional[str]

    model_config = {"from_attributes": True}


class HabitPaginatedResponse(BaseModel):
    items: list[HabitResponse]
    total: int
    limit: int
    offset: int

@router.get("/", response_model=HabitPaginatedResponse)
async def list_habits(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func
    count_stmt = select(func.count()).select_from(Habit).where(
        Habit.user_id == current_user.id, Habit.is_active == True
    )
    total = await db.scalar(count_stmt) or 0

    result = await db.execute(
        select(Habit)
        .where(Habit.user_id == current_user.id, Habit.is_active == True)
        .order_by(Habit.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    items = result.scalars().all()
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.post("/", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
async def create_habit(
    body: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    habit = Habit(user_id=current_user.id, **body.model_dump())
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return habit


@router.post("/{habit_id}/log", response_model=HabitLogResponse, status_code=status.HTTP_201_CREATED)
async def log_habit(
    habit_id: uuid.UUID,
    body: HabitLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Log a habit completion for a specific date."""
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Habit not found")

    # Upsert: update existing log or create new
    log_result = await db.execute(
        select(HabitLog).where(HabitLog.habit_id == habit_id, HabitLog.date == body.date)
    )
    log = log_result.scalar_one_or_none()
    if log:
        log.completed = body.completed
        log.note = body.note
    else:
        log = HabitLog(habit_id=habit_id, user_id=current_user.id, **body.model_dump())
        db.add(log)

    await db.commit()
    await db.refresh(log)
    return log


@router.get("/{habit_id}/logs", response_model=list[HabitLogResponse])
async def get_habit_logs(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HabitLog)
        .where(HabitLog.habit_id == habit_id, HabitLog.user_id == current_user.id)
        .order_by(HabitLog.date.desc())
        .limit(90)
    )
    return result.scalars().all()


@router.patch("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: uuid.UUID,
    body: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(habit, key, value)

    await db.commit()
    await db.refresh(habit)
    return habit


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Habit).where(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    habit.is_active = False
    await db.commit()
