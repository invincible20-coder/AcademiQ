import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import TopicMastery, Course

async def get_mastery_context(db: AsyncSession, user_id: uuid.UUID) -> str:
    result = await db.execute(
        select(TopicMastery, Course.name)
        .join(Course, Course.id == TopicMastery.course_id)
        .where(TopicMastery.user_id == user_id)
        .order_by(TopicMastery.mastery_score.asc())
        .limit(10)
    )
    records = result.all()
    if not records:
        return "No mastery records yet."
    
    lines = []
    for m, c_name in records:
        lines.append(f"- Course: {c_name} | Topic: {m.topic_name} | Mastery Score: {m.mastery_score}%")
    return "\n".join(lines)
