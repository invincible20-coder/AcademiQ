import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CourseBase(BaseModel):
    course_name: str
    course_code: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    semester: Optional[str] = None
    credits: Optional[int] = None
    color_theme: Optional[str] = "#7C3AED"


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    semester: Optional[str] = None
    credits: Optional[int] = None
    color_theme: Optional[str] = None
    is_archived: Optional[bool] = None


class CourseResponse(CourseBase):
    id: uuid.UUID
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseListResponse(BaseModel):
    items: list[CourseResponse]
    total: int
