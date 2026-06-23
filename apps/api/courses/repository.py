import uuid
from typing import Optional, Sequence
from sqlalchemy import select, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Course


class CourseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, course_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Course]:
        result = await self.db.execute(
            select(Course).where(
                Course.id == course_id,
                Course.user_id == user_id,
                Course.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, course_code: str, user_id: uuid.UUID) -> Optional[Course]:
        result = await self.db.execute(
            select(Course).where(
                Course.course_code == course_code,
                Course.user_id == user_id,
                Course.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def list_courses(
        self,
        user_id: uuid.UUID,
        search: Optional[str] = None,
        semester: Optional[str] = None,
        is_archived: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[Course]:
        query = select(Course).where(
            Course.user_id == user_id,
            Course.deleted_at.is_(None)
        )

        if search:
            query = query.where(
                or_(
                    Course.course_name.ilike(f"%{search}%"),
                    Course.course_code.ilike(f"%{search}%"),
                    Course.instructor.ilike(f"%{search}%"),
                )
            )

        if semester:
            query = query.where(Course.semester == semester)

        if is_archived is not None:
            query = query.where(Course.is_archived == is_archived)

        query = query.order_by(desc(Course.created_at)).offset(skip).limit(limit)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def create(self, course: Course) -> Course:
        self.db.add(course)
        await self.db.commit()
        await self.db.refresh(course)
        return course

    async def update(self, course: Course) -> Course:
        await self.db.commit()
        await self.db.refresh(course)
        return course
