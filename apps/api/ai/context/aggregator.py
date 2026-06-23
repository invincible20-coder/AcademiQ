import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from .tasks import get_tasks_context
from .habits import get_habits_context
from .courses import get_courses_context
from .schedule import get_schedule_context
from .quizzes import get_mastery_context

async def get_user_context(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Aggregates all user context into a single structured Markdown string."""
    tasks = await get_tasks_context(db, user_id)
    habits = await get_habits_context(db, user_id)
    courses = await get_courses_context(db, user_id)
    schedule = await get_schedule_context(db, user_id)
    mastery = await get_mastery_context(db, user_id)
    
    return f"""
<UserContext>
## Active Courses
{courses}

## Pending Tasks
{tasks}

## Active Habits
{habits}

## Schedule
{schedule}

## Weak Topics & Mastery
{mastery}
</UserContext>
"""
