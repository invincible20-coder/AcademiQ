import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Task, TaskStatus

async def get_tasks_context(db: AsyncSession, user_id: uuid.UUID) -> str:
    result = await db.execute(
        select(Task).where(
            Task.user_id == user_id,
            Task.deleted_at.is_(None),
            Task.status != TaskStatus.completed
        ).order_by(Task.due_date.asc().nulls_last()).limit(10)
    )
    tasks = result.scalars().all()
    
    if not tasks:
        return "No pending tasks."
        
    lines = ["Pending Tasks:"]
    for t in tasks:
        due = f" (Due: {t.due_date.strftime('%Y-%m-%d')})" if t.due_date else ""
        lines.append(f"- [{t.priority.value.upper()}] {t.title}{due}")
    
    return "\n".join(lines)
