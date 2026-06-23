import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from database.models import User
from routers.deps import get_current_user

from .schemas import CourseCreate, CourseUpdate, CourseResponse
from .repository import CourseRepository
from .service import CourseService

router = APIRouter()


def get_course_service(db: AsyncSession = Depends(get_db)) -> CourseService:
    repository = CourseRepository(db)
    return CourseService(repository)


@router.get("/", response_model=list[CourseResponse])
async def list_courses(
    search: Optional[str] = Query(None, description="Search by name, code, or instructor"),
    semester: Optional[str] = Query(None, description="Filter by semester"),
    archived: Optional[bool] = Query(None, description="Filter by archived status"),
    current_user: User = Depends(get_current_user),
    service: CourseService = Depends(get_course_service),
):
    return await service.list_courses(
        user_id=current_user.id,
        search=search,
        semester=semester,
        is_archived=archived
    )


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    body: CourseCreate,
    current_user: User = Depends(get_current_user),
    service: CourseService = Depends(get_course_service),
):
    return await service.create_course(body, current_user.id)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CourseService = Depends(get_course_service),
):
    return await service.get_course(course_id, current_user.id)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: uuid.UUID,
    body: CourseUpdate,
    current_user: User = Depends(get_current_user),
    service: CourseService = Depends(get_course_service),
):
    return await service.update_course(course_id, body, current_user.id)


@router.patch("/{course_id}/archive", response_model=CourseResponse)
async def archive_course(
    course_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CourseService = Depends(get_course_service),
):
    return await service.archive_course(course_id, current_user.id)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CourseService = Depends(get_course_service),
):
    await service.delete_course(course_id, current_user.id)
