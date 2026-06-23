from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
from database.models import RoadmapStatus, NodeDifficulty, NodePriority, NodeStatus

class RoadmapProgressSchema(BaseModel):
    id: uuid.UUID
    completion_percentage: int
    last_activity: datetime
    
    class Config:
        from_attributes = True

class RoadmapNodeSchema(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    estimated_hours: Optional[int] = None
    difficulty: NodeDifficulty
    priority: NodePriority
    status: NodeStatus
    order_index: int
    mastery_target: int
    progress: Optional[RoadmapProgressSchema] = None
    
    class Config:
        from_attributes = True

class LearningRoadmapSchema(BaseModel):
    id: uuid.UUID
    title: str
    goal: str
    target_date: Optional[datetime] = None
    status: RoadmapStatus
    created_at: datetime
    updated_at: datetime
    nodes: List[RoadmapNodeSchema] = []
    
    class Config:
        from_attributes = True

class GenerateRoadmapRequest(BaseModel):
    title: str
    goal: str
    course_id: Optional[uuid.UUID] = None
    target_date: Optional[datetime] = None

class UpdateProgressRequest(BaseModel):
    completion_percentage: int = Field(..., ge=0, le=100)

class RecalculateRequest(BaseModel):
    pass # In future, could take parameters for strictness etc.
