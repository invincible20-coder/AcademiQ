import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Course

async def get_courses_context(db: AsyncSession, user_id: uuid.UUID) -> str:
    result = await db.execute(
        select(Course).where(
            Course.user_id == user_id,
            Course.is_archived == False,
            Course.deleted_at.is_(None)
        )
    )
    courses = result.scalars().all()
    
    if not courses:
        return "No active courses enrolled."
        
    lines = ["Active Courses:"]
    for c in courses:
        code = f" ({c.course_code})" if c.course_code else ""
        lines.append(f"- {c.course_name}{code}")
        
    return "\n".join(lines)
