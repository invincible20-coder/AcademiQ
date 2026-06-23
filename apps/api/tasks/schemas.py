from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid
from database.models import Priority, TaskStatus

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[Priority] = Priority.medium
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    due_date: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: uuid.UUID
    status: TaskStatus
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TaskPaginatedResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    limit: int
    offset: int
