import uuid
from datetime import datetime, timezone
from typing import Optional, Sequence
from fastapi import HTTPException

from database.models import Course
from .schemas import CourseCreate, CourseUpdate
from .repository import CourseRepository


class CourseService:
    def __init__(self, repository: CourseRepository):
        self.repository = repository

    async def get_course(self, course_id: uuid.UUID, user_id: uuid.UUID) -> Course:
        course = await self.repository.get_by_id(course_id, user_id)
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return course

    async def list_courses(
        self,
        user_id: uuid.UUID,
        search: Optional[str] = None,
        semester: Optional[str] = None,
        is_archived: Optional[bool] = None,
    ) -> Sequence[Course]:
        return await self.repository.list_courses(
            user_id=user_id,
            search=search,
            semester=semester,
            is_archived=is_archived
        )

    async def create_course(self, data: CourseCreate, user_id: uuid.UUID) -> Course:
        # Enforce unique course code per user if provided
        if data.course_code:
            existing = await self.repository.get_by_code(data.course_code, user_id)
            if existing:
                raise HTTPException(status_code=400, detail="Course code already exists")

        course = Course(
            user_id=user_id,
            **data.model_dump()
        )
        return await self.repository.create(course)

    async def update_course(self, course_id: uuid.UUID, data: CourseUpdate, user_id: uuid.UUID) -> Course:
        course = await self.get_course(course_id, user_id)
        
        if data.course_code and data.course_code != course.course_code:
            existing = await self.repository.get_by_code(data.course_code, user_id)
            if existing:
                raise HTTPException(status_code=400, detail="Course code already exists")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(course, key, value)

        return await self.repository.update(course)

    async def archive_course(self, course_id: uuid.UUID, user_id: uuid.UUID) -> Course:
        course = await self.get_course(course_id, user_id)
        course.is_archived = True
        return await self.repository.update(course)

    async def delete_course(self, course_id: uuid.UUID, user_id: uuid.UUID) -> None:
        course = await self.get_course(course_id, user_id)
        # Soft delete
        course.deleted_at = datetime.now(timezone.utc)
        await self.repository.update(course)
