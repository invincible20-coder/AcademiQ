import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from database.models import DocumentStatus

class DocumentResponse(BaseModel):
    id: uuid.UUID
    course_id: Optional[uuid.UUID]
    title: str
    file_name: str
    file_type: str
    file_size: int
    status: DocumentStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    title: str
    course_id: Optional[uuid.UUID] = None

class DocumentPaginatedResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    limit: int
    offset: int
