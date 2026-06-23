from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from auth.dependencies import get_current_user
from database.connection import get_db
from database.models import User
from roadmaps.repository import RoadmapRepository
from roadmaps.schemas import (
    LearningRoadmapSchema, 
    GenerateRoadmapRequest, 
    UpdateProgressRequest,
    RecalculateRequest
)
# We will create this module next
from roadmaps.generator import generate_roadmap_background, recalculate_roadmap_background

router = APIRouter(prefix="/roadmaps", tags=["Roadmaps"])

def get_repo(db: AsyncSession = Depends(get_db)) -> RoadmapRepository:
    return RoadmapRepository(db)

@router.post("/generate", response_model=LearningRoadmapSchema)
async def generate_roadmap(
    request: GenerateRoadmapRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    repo: RoadmapRepository = Depends(get_repo),
    db: AsyncSession = Depends(get_db)
):
    # 1. Create a stub Roadmap in 'generating' state
    roadmap = await repo.create_roadmap_stub(
        user_id=current_user.id,
        title=request.title,
        goal=request.goal,
        course_id=request.course_id,
        target_date=request.target_date
    )
    
    # 2. Enqueue LangGraph processing
    background_tasks.add_task(
        generate_roadmap_background,
        roadmap.id,
        current_user.id
    )
    
    return roadmap

@router.get("/", response_model=List[LearningRoadmapSchema])
async def list_roadmaps(
    current_user: User = Depends(get_current_user),
    repo: RoadmapRepository = Depends(get_repo)
):
    roadmaps = await repo.list_roadmaps(current_user.id)
    return roadmaps

@router.get("/{roadmap_id}", response_model=LearningRoadmapSchema)
async def get_roadmap(
    roadmap_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    repo: RoadmapRepository = Depends(get_repo)
):
    roadmap = await repo.get_roadmap(roadmap_id, current_user.id)
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return roadmap

@router.patch("/nodes/{node_id}/progress")
async def update_node_progress(
    node_id: uuid.UUID,
    request: UpdateProgressRequest,
    current_user: User = Depends(get_current_user),
    repo: RoadmapRepository = Depends(get_repo)
):
    node = await repo.update_node_progress(
        node_id=node_id, 
        user_id=current_user.id, 
        percentage=request.completion_percentage
    )
    if not node:
        raise HTTPException(status_code=404, detail="Node not found or unauthorized")
    return {"status": "success", "percentage": request.completion_percentage}

@router.post("/{roadmap_id}/recalculate")
async def recalculate_roadmap(
    roadmap_id: uuid.UUID,
    request: RecalculateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    repo: RoadmapRepository = Depends(get_repo)
):
    roadmap = await repo.get_roadmap(roadmap_id, current_user.id)
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
        
    background_tasks.add_task(
        recalculate_roadmap_background,
        roadmap.id,
        current_user.id
    )
    
    return {"status": "recalculating"}
