"""
Agents router — AI agent endpoints with Server-Sent Events (SSE) streaming.
All agent responses stream in real-time so the UI is never blocked.
"""
import uuid
import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, AsyncIterator

from database.connection import get_db
from database.models import User
from routers.deps import get_current_user
from agents.graph import run_agent_stream

router = APIRouter()


# ─── Request Schemas ─────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    topic: str
    subject_category: str
    knowledge_level: str
    learning_goal: str
    time_available: str
    learning_style: str
    model_provider: str = "groq"


class RoadmapRequest(BaseModel):
    topic: str
    subject_id: Optional[uuid.UUID] = None
    student_analysis: Optional[str] = None
    model_provider: str = "groq"


class TutorRequest(BaseModel):
    question: str
    topic: str
    context: Optional[str] = ""
    model_provider: str = "groq"


class QuizRequest(BaseModel):
    topic: str
    difficulty: str = "intermediate"
    focus_areas: Optional[str] = "general"
    num_questions: int = 10
    subject_id: Optional[uuid.UUID] = None
    model_provider: str = "groq"


class QuizSubmitRequest(BaseModel):
    quiz_result_id: uuid.UUID
    answers: dict


class ResourceRequest(BaseModel):
    topic: str
    knowledge_level: str
    learning_style: str
    learning_goal: str


class RAGQueryRequest(BaseModel):
    question: str
    collection_id: Optional[str] = None


# ─── SSE helper ──────────────────────────────────────────────────────────────

async def event_stream(agent_type: str, payload: dict, user_id: str) -> AsyncIterator[str]:
    """Wraps agent execution in SSE format."""
    try:
        async for chunk in run_agent_stream(agent_type, payload, user_id):
            data = json.dumps({"type": "chunk", "content": chunk})
            yield f"data: {data}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_student(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
):
    """Run Student Analyzer Agent — returns SSE stream."""
    return StreamingResponse(
        event_stream("student_analyzer", body.model_dump(), str(current_user.id)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/roadmap")
async def generate_roadmap(
    body: RoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run Roadmap Agent — returns SSE stream."""
    return StreamingResponse(
        event_stream("roadmap_agent", body.model_dump(), str(current_user.id)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/tutor")
async def ask_tutor(
    body: TutorRequest,
    current_user: User = Depends(get_current_user),
):
    """Run Tutor Agent — returns SSE stream."""
    return StreamingResponse(
        event_stream("tutor_agent", body.model_dump(), str(current_user.id)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/quiz/generate")
async def generate_quiz(
    body: QuizRequest,
    current_user: User = Depends(get_current_user),
):
    """Run Quiz Agent — returns SSE stream."""
    return StreamingResponse(
        event_stream("quiz_agent", body.model_dump(), str(current_user.id)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/resources")
async def find_resources(
    body: ResourceRequest,
    current_user: User = Depends(get_current_user),
):
    """Run Resource Researcher Agent — returns SSE stream."""
    return StreamingResponse(
        event_stream("resource_researcher", body.model_dump(), str(current_user.id)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/rag/query")
async def rag_query(
    body: RAGQueryRequest,
    current_user: User = Depends(get_current_user),
):
    """Run RAG Knowledge Agent — returns SSE stream."""
    payload = body.model_dump()
    payload["user_id"] = str(current_user.id)
    return StreamingResponse(
        event_stream("rag_agent", payload, str(current_user.id)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/coach/daily")
async def daily_coaching(
    current_user: User = Depends(get_current_user),
):
    """Get daily coaching message from Productivity Coach Agent."""
    return StreamingResponse(
        event_stream("productivity_coach", {"user_id": str(current_user.id)}, str(current_user.id)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
