import uuid
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import User
from routers.deps import get_current_user
from .schemas import TaskCreate, TaskUpdate, TaskResponse, TaskPaginatedResponse
from .service import TaskService

router = APIRouter(tags=["tasks"])

def get_task_service(session: AsyncSession = Depends(get_db)) -> TaskService:
    return TaskService(session)

@router.get("", response_model=TaskPaginatedResponse)
async def list_tasks(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    items, total = await service.get_tasks(current_user.id, limit, offset)
    return {"items": items, "total": total, "limit": limit, "offset": offset}

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    return await service.create_task(current_user.id, task)

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    return await service.get_task(task_id, current_user.id)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    task: TaskUpdate,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    return await service.update_task(task_id, current_user.id, task)

@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def toggle_task_complete(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    return await service.toggle_complete(task_id, current_user.id)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: TaskService = Depends(get_task_service)
):
    await service.delete_task(task_id, current_user.id)
