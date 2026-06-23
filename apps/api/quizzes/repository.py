import uuid
from datetime import datetime, timezone
from typing import Sequence, Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Quiz, QuizQuestion, QuizAttempt, QuizResponse, TopicMastery, QuizStatus

class QuizRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_quiz(self, user_id: uuid.UUID, **kwargs) -> Quiz:
        quiz = Quiz(user_id=user_id, status=QuizStatus.generating, **kwargs)
        self.db.add(quiz)
        await self.db.commit()
        await self.db.refresh(quiz)
        return quiz

    async def get_quiz(self, quiz_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Quiz]:
        result = await self.db.execute(
            select(Quiz).where(Quiz.id == quiz_id, Quiz.user_id == user_id, Quiz.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_quizzes(self, user_id: uuid.UUID) -> Sequence[Quiz]:
        result = await self.db.execute(
            select(Quiz).where(Quiz.user_id == user_id, Quiz.deleted_at.is_(None)).order_by(Quiz.created_at.desc())
        )
        return result.scalars().all()

    async def get_quiz_questions(self, quiz_id: uuid.UUID) -> Sequence[QuizQuestion]:
        result = await self.db.execute(
            select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id)
        )
        return result.scalars().all()

    async def add_questions(self, quiz_id: uuid.UUID, questions_data: List[dict]) -> None:
        questions = [QuizQuestion(quiz_id=quiz_id, **q) for q in questions_data]
        self.db.add_all(questions)
        await self.db.commit()

    async def update_status(self, quiz_id: uuid.UUID, status: QuizStatus) -> None:
        result = await self.db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = result.scalar_one_or_none()
        if quiz:
            quiz.status = status
            await self.db.commit()

    async def start_attempt(self, quiz_id: uuid.UUID, user_id: uuid.UUID, total_questions: int) -> QuizAttempt:
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=user_id,
            total_questions=total_questions
        )
        self.db.add(attempt)
        await self.db.commit()
        await self.db.refresh(attempt)
        return attempt

    async def get_attempt(self, attempt_id: uuid.UUID, user_id: uuid.UUID) -> Optional[QuizAttempt]:
        result = await self.db.execute(
            select(QuizAttempt).where(QuizAttempt.id == attempt_id, QuizAttempt.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def submit_attempt(self, attempt_id: uuid.UUID, responses_data: List[dict], score_data: dict) -> QuizAttempt:
        # Add responses
        responses = [QuizResponse(attempt_id=attempt_id, **r) for r in responses_data]
        self.db.add_all(responses)
        
        # Update attempt
        result = await self.db.execute(select(QuizAttempt).where(QuizAttempt.id == attempt_id))
        attempt = result.scalar_one()
        attempt.completed_at = datetime.now(timezone.utc)
        for k, v in score_data.items():
            setattr(attempt, k, v)
        
        await self.db.commit()
        await self.db.refresh(attempt)
        return attempt

    async def update_topic_mastery(self, user_id: uuid.UUID, course_id: uuid.UUID, topic_name: str, delta_score: int) -> TopicMastery:
        result = await self.db.execute(
            select(TopicMastery).where(
                TopicMastery.user_id == user_id, 
                TopicMastery.course_id == course_id, 
                TopicMastery.topic_name == topic_name
            )
        )
        mastery = result.scalar_one_or_none()
        if not mastery:
            mastery = TopicMastery(
                user_id=user_id,
                course_id=course_id,
                topic_name=topic_name,
                mastery_score=max(0, min(100, delta_score)),
                attempt_count=1,
                last_assessed_at=datetime.now(timezone.utc)
            )
            self.db.add(mastery)
        else:
            mastery.attempt_count += 1
            # Simple moving average or weighted average for mastery updates
            mastery.mastery_score = max(0, min(100, (mastery.mastery_score * 0.8) + (delta_score * 0.2)))
            mastery.last_assessed_at = datetime.now(timezone.utc)
            
        await self.db.commit()
        return mastery
