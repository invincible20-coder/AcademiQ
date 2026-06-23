"""Assignments router — CRUD + AI breakdown trigger."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database.connection import get_db
from database.models import User, Assignment, AssignmentStatus, Priority
from routers.deps import get_current_user

router = APIRouter()


class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: Optional[uuid.UUID] = None
    due_at: Optional[datetime] = None
    priority: Priority = Priority.medium


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_at: Optional[datetime] = None
    status: Optional[AssignmentStatus] = None
    priority: Optional[Priority] = None


class AssignmentResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    subject_id: Optional[uuid.UUID]
    due_at: Optional[datetime]
    status: AssignmentStatus
    priority: Priority
    ai_breakdown: Optional[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[AssignmentResponse])
async def list_assignments(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Assignment).where(Assignment.user_id == current_user.id)
    if status_filter:
        query = query.where(Assignment.status == status_filter)
    result = await db.execute(query.order_by(Assignment.due_at.asc().nullslast()))
    return result.scalars().all()


@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    body: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    assignment = Assignment(user_id=current_user.id, **body.model_dump())
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.patch("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: uuid.UUID,
    body: AssignmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id, Assignment.user_id == current_user.id)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(assignment, field, value)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Assignment).where(Assignment.id == assignment_id, Assignment.user_id == current_user.id)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(assignment)
    await db.commit()
