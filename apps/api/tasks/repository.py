import uuid
from datetime import datetime, timezone
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Task, Priority

class TaskRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_by_user(self, user_id: uuid.UUID, limit: int = 50, offset: int = 0) -> tuple[list[Task], int]:
        # Get total count
        count_stmt = select(func.count()).select_from(Task).where(
            Task.user_id == user_id, 
            Task.deleted_at.is_(None)
        )
        total = await self.session.scalar(count_stmt) or 0

        # Get items
        stmt = select(Task).where(Task.user_id == user_id, Task.deleted_at.is_(None)).order_by(
            Task.due_date.asc().nulls_last(),
            Task.created_at.desc()
        ).limit(limit).offset(offset)
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_by_id(self, task_id: uuid.UUID, user_id: uuid.UUID) -> Task | None:
        stmt = select(Task).where(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, task: Task) -> Task:
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def update(self, task: Task, update_data: dict) -> Task:
        for key, value in update_data.items():
            setattr(task, key, value)
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def delete(self, task: Task) -> Task:
        task.deleted_at = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(task)
        return task
