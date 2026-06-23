import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from database.connection import get_db
from database.models import User
from routers.deps import get_current_user
from .schemas import (
    QuizGenerateRequest, QuizResponse, QuizQuestionResponse, 
    QuizAttemptStartRequest, QuizAttemptResponse, QuizSubmitRequest, QuizResultResponse
)
from .repository import QuizRepository
from .generator import generate_quiz_background

router = APIRouter()

def get_repo(db: AsyncSession = Depends(get_db)) -> QuizRepository:
    return QuizRepository(db)

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(
    req: QuizGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_repo)
):
    # 1. Create stub in DB
    quiz = await repo.create_quiz(
        user_id=current_user.id,
        course_id=req.course_id,
        document_id=req.document_id,
        title=req.title,
        difficulty=req.difficulty
    )
    
    # 2. Trigger async generation
    background_tasks.add_task(
        generate_quiz_background,
        quiz_id=quiz.id,
        user_id=current_user.id,
        course_id=req.course_id,
        document_id=req.document_id,
        title=req.title,
        difficulty=req.difficulty,
        question_count=req.question_count,
        question_types=req.question_types
    )
    
    return quiz

@router.get("/", response_model=List[QuizResponse])
async def list_quizzes(
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_repo)
):
    return await repo.list_quizzes(current_user.id)

@router.get("/{quiz_id}", response_model=dict)
async def get_quiz(
    quiz_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_repo)
):
    quiz = await repo.get_quiz(quiz_id, current_user.id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    questions = await repo.get_quiz_questions(quiz_id)
    # Strip sensitive data via Pydantic model dump
    q_responses = [QuizQuestionResponse.model_validate(q).model_dump() for q in questions]
    
    return {
        "quiz": QuizResponse.model_validate(quiz).model_dump(),
        "questions": q_responses
    }

@router.post("/{quiz_id}/attempts", response_model=QuizAttemptResponse)
async def start_attempt(
    quiz_id: uuid.UUID,
    req: QuizAttemptStartRequest,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_repo)
):
    quiz = await repo.get_quiz(quiz_id, current_user.id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    questions = await repo.get_quiz_questions(quiz_id)
    if not questions:
        raise HTTPException(status_code=400, detail="Quiz has no questions")
        
    attempt = await repo.start_attempt(quiz.id, current_user.id, len(questions))
    return attempt

@router.get("/attempts/{attempt_id}", response_model=QuizResultResponse)
async def get_attempt_result(
    attempt_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_repo)
):
    attempt = await repo.get_attempt(attempt_id, current_user.id)
    if not attempt or attempt.completed_at is None:
        raise HTTPException(status_code=404, detail="Attempt not found or not completed")
    
    return {
        "attempt_id": attempt.id,
        "score": attempt.score,
        "correct_answers": attempt.correct_answers,
        "total_questions": attempt.total_questions,
        "percentage": attempt.percentage,
        "time_taken_seconds": attempt.time_taken_seconds
    }

@router.post("/attempts/{attempt_id}/submit", response_model=QuizResultResponse)
async def submit_attempt(
    attempt_id: uuid.UUID,
    req: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_repo)
):
    attempt = await repo.get_attempt(attempt_id, current_user.id)
    if not attempt or attempt.completed_at is not None:
        raise HTTPException(status_code=400, detail="Invalid attempt or already submitted")
        
    quiz_id = attempt.quiz_id
    questions = await repo.get_quiz_questions(quiz_id)
    q_map = {q.id: q for q in questions}
    
    correct_answers = 0
    responses_data = []
    
    # Very simple exact match grading for now. For production, LLM grading for short answer is required.
    for ans in req.answers:
        q = q_map.get(ans.question_id)
        is_correct = False
        if q:
            # Case insensitive exact match for simple types
            if str(ans.user_answer).strip().lower() == str(q.correct_answer).strip().lower():
                is_correct = True
                correct_answers += 1
                
        responses_data.append({
            "question_id": ans.question_id,
            "user_answer": ans.user_answer,
            "is_correct": is_correct,
            "confidence_score": ans.confidence_score
        })
        
    total = len(questions)
    percentage = int((correct_answers / total) * 100) if total > 0 else 0
    
    from datetime import datetime, timezone
    time_taken = int((datetime.now(timezone.utc) - attempt.started_at).total_seconds())
    
    score_data = {
        "score": correct_answers,
        "correct_answers": correct_answers,
        "percentage": percentage,
        "time_taken_seconds": time_taken
    }
    
    final_attempt = await repo.submit_attempt(attempt_id, responses_data, score_data)
    
    # Adaptive Analytics - update TopicMastery if course_id is present
    quiz = await repo.get_quiz(quiz_id, current_user.id)
    if quiz and quiz.course_id:
        # We group performance by topic. Currently quiz has title instead of topic. We'll use title as topic.
        await repo.update_topic_mastery(
            user_id=current_user.id,
            course_id=quiz.course_id,
            topic_name=quiz.title,
            delta_score=percentage
        )
    
    return {
        "attempt_id": final_attempt.id,
        "score": final_attempt.score,
        "correct_answers": final_attempt.correct_answers,
        "total_questions": final_attempt.total_questions,
        "percentage": final_attempt.percentage,
        "time_taken_seconds": final_attempt.time_taken_seconds
    }
