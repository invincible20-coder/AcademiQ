import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Habit

async def get_habits_context(db: AsyncSession, user_id: uuid.UUID) -> str:
    result = await db.execute(
        select(Habit).where(
            Habit.user_id == user_id,
            Habit.is_active == True,
            Habit.deleted_at.is_(None)
        ).order_by(Habit.created_at.desc()).limit(5)
    )
    habits = result.scalars().all()
    
    if not habits:
        return "No active habits."
        
    lines = ["Active Habits:"]
    for h in habits:
        streak = f" (Current streak: {h.current_streak} days)" if h.current_streak > 0 else ""
        lines.append(f"- {h.title} [{h.frequency.value}]{streak}")
        
    return "\n".join(lines)
