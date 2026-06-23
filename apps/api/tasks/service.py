import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from database.models import Task, TaskStatus
from .repository import TaskRepository
from .schemas import TaskCreate, TaskUpdate

class TaskService:
    def __init__(self, session: AsyncSession):
        self.repository = TaskRepository(session)

    async def get_tasks(self, user_id: uuid.UUID, limit: int = 50, offset: int = 0) -> tuple[list[Task], int]:
        return await self.repository.get_all_by_user(user_id, limit, offset)

    async def get_task(self, task_id: uuid.UUID, user_id: uuid.UUID) -> Task:
        task = await self.repository.get_by_id(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    async def create_task(self, user_id: uuid.UUID, task_data: TaskCreate) -> Task:
        task = Task(
            user_id=user_id,
            **task_data.model_dump(exclude_unset=True)
        )
        return await self.repository.create(task)

    async def update_task(self, task_id: uuid.UUID, user_id: uuid.UUID, task_data: TaskUpdate) -> Task:
        task = await self.get_task(task_id, user_id)
        update_data = task_data.model_dump(exclude_unset=True)
        return await self.repository.update(task, update_data)

    async def toggle_complete(self, task_id: uuid.UUID, user_id: uuid.UUID) -> Task:
        task = await self.get_task(task_id, user_id)
        if task.status == TaskStatus.completed:
            task.status = TaskStatus.pending
            task.completed_at = None
        else:
            task.status = TaskStatus.completed
            task.completed_at = datetime.now(timezone.utc)
        return await self.repository.update(task, {})

    async def delete_task(self, task_id: uuid.UUID, user_id: uuid.UUID) -> None:
        task = await self.get_task(task_id, user_id)
        await self.repository.delete(task)
