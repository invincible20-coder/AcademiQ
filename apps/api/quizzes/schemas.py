import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from database.models import QuizStatus, QuestionType, Difficulty

class QuizGenerateRequest(BaseModel):
    title: str
    course_id: Optional[uuid.UUID] = None
    document_id: Optional[uuid.UUID] = None
    difficulty: Difficulty = Difficulty.intermediate
    question_count: int = 5
    question_types: List[QuestionType] = [QuestionType.multiple_choice]

class QuizQuestionResponse(BaseModel):
    id: uuid.UUID
    question_type: QuestionType
    question: str
    options: Optional[Dict[str, Any]] = None
    # We purposefully exclude correct_answer and explanation so the user can't cheat!
    
    class Config:
        from_attributes = True

class QuizResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    difficulty: Difficulty
    status: QuizStatus
    course_id: Optional[uuid.UUID] = None
    document_id: Optional[uuid.UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuizAttemptStartRequest(BaseModel):
    pass

class QuizAttemptResponse(BaseModel):
    id: uuid.UUID
    quiz_id: uuid.UUID
    total_questions: int
    started_at: datetime
    
    class Config:
        from_attributes = True

class QuestionAnswer(BaseModel):
    question_id: uuid.UUID
    user_answer: str
    confidence_score: Optional[int] = None

class QuizSubmitRequest(BaseModel):
    answers: List[QuestionAnswer]

class QuizResultResponse(BaseModel):
    attempt_id: uuid.UUID
    score: int
    correct_answers: int
    total_questions: int
    percentage: int
    time_taken_seconds: int
    
    class Config:
        from_attributes = True
