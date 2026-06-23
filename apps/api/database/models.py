"""
SQLAlchemy ORM Models — all 12 tables from the architecture.
"""
import uuid
import enum
from datetime import datetime, date
from sqlalchemy import (
    String, Text, Boolean, SmallInteger, Integer, DateTime,
    Date, Time, ForeignKey, UniqueConstraint, JSON, Enum as SAEnum,
    ARRAY,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from database.connection import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class QuizStatus(str, enum.Enum):
    generating = "generating"
    ready = "ready"
    failed = "failed"


class QuestionType(str, enum.Enum):
    multiple_choice = "multiple_choice"
    true_false = "true_false"
    fill_in_blank = "fill_in_blank"
    short_answer = "short_answer"
    matching = "matching"


class RoadmapStatus(str, enum.Enum):
    generating = "generating"
    active = "active"
    completed = "completed"
    archived = "archived"


class NodeDifficulty(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class NodePriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class NodeStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    skipped = "skipped"


class LearningStyle(str, enum.Enum):
    visual = "visual"
    auditory = "auditory"
    kinesthetic = "kinesthetic"
    reading_writing = "reading_writing"
    mixed = "mixed"


class KnowledgeLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"


class AssignmentStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    overdue = "overdue"


class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"



class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class SessionType(str, enum.Enum):
    reading = "reading"
    practice = "practice"
    quiz = "quiz"
    tutor = "tutor"
    flashcards = "flashcards"


class EventType(str, enum.Enum):
    CLASS = "CLASS"
    LAB = "LAB"
    TUTORIAL = "TUTORIAL"
    EXAM = "EXAM"
    ASSIGNMENT = "ASSIGNMENT"
    STUDY_SESSION = "STUDY_SESSION"
    REVISION = "REVISION"
    PERSONAL = "PERSONAL"


class HabitFrequency(str, enum.Enum):
    daily = "daily"
    weekdays = "weekdays"
    weekends = "weekends"
    custom = "custom"


class GoalStatus(str, enum.Enum):
    active = "active"
    achieved = "achieved"
    abandoned = "abandoned"


class Difficulty(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class FileType(str, enum.Enum):
    pdf = "pdf"
    txt = "txt"
    docx = "docx"


class MemoryType(str, enum.Enum):
    short_term = "short_term"
    long_term = "long_term"
    episodic = "episodic"


class DocumentStatus(str, enum.Enum):
    processing = "processing"
    ready = "ready"
    failed = "failed"


class SnapshotPeriod(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


# ─── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    display_name: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    learning_style: Mapped[LearningStyle | None] = mapped_column(SAEnum(LearningStyle))
    knowledge_level: Mapped[KnowledgeLevel | None] = mapped_column(SAEnum(KnowledgeLevel))
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tasks: Mapped[list["Task"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    courses: Mapped[list["Course"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    habits: Mapped[list["Habit"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    study_sessions: Mapped[list["StudySession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    agent_memories: Mapped[list["AgentMemory"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    analytics_snapshots: Mapped[list["AnalyticsSnapshot"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    quizzes: Mapped[list["Quiz"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    topic_mastery: Mapped[list["TopicMastery"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    roadmaps: Mapped[list["LearningRoadmap"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    roadmap_progress: Mapped[list["RoadmapProgress"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_name: Mapped[str] = mapped_column(String(255), nullable=False)
    course_code: Mapped[str | None] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(Text)
    instructor: Mapped[str | None] = mapped_column(String(255))
    semester: Mapped[str | None] = mapped_column(String(50), index=True)
    credits: Mapped[int | None] = mapped_column(SmallInteger)
    color_theme: Mapped[str | None] = mapped_column(String(7))
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (UniqueConstraint("user_id", "course_code", name="uq_user_course_code"),)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="courses")
    schedule_events: Mapped[list["ScheduleEvent"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    roadmaps: Mapped[list["LearningRoadmap"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    study_sessions: Mapped[list["StudySession"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    quizzes: Mapped[list["Quiz"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    topic_mastery: Mapped[list["TopicMastery"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="course", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[Priority] = mapped_column(SAEnum(Priority), default=Priority.medium, index=True)
    status: Mapped[TaskStatus] = mapped_column(SAEnum(TaskStatus), default=TaskStatus.pending, index=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    user: Mapped["User"] = relationship(back_populates="tasks")


class ScheduleEvent(Base):
    __tablename__ = "schedule_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    event_type: Mapped[EventType] = mapped_column(SAEnum(EventType), nullable=False, index=True)
    location: Mapped[str | None] = mapped_column(String(255))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_all_day: Mapped[bool] = mapped_column(Boolean, default=False)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_rule: Mapped[str | None] = mapped_column(String(500))
    color_theme: Mapped[str | None] = mapped_column(String(7))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    course: Mapped["Course | None"] = relationship(back_populates="schedule_events")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[AssignmentStatus] = mapped_column(SAEnum(AssignmentStatus), default=AssignmentStatus.pending, index=True)
    priority: Mapped[Priority] = mapped_column(SAEnum(Priority), default=Priority.medium)
    ai_breakdown: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    course: Mapped["Course | None"] = relationship(back_populates="assignments")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_min: Mapped[int | None] = mapped_column(SmallInteger)
    session_type: Mapped[SessionType | None] = mapped_column(SAEnum(SessionType))
    focus_score: Mapped[int | None] = mapped_column(SmallInteger)  # 1-10
    notes: Mapped[str | None] = mapped_column(Text)
    ai_summary: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="study_sessions")


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    frequency: Mapped[HabitFrequency] = mapped_column(SAEnum(HabitFrequency), default=HabitFrequency.daily)
    target_days: Mapped[list[int] | None] = mapped_column(ARRAY(SmallInteger))
    icon: Mapped[str | None] = mapped_column(String(10))
    color: Mapped[str | None] = mapped_column(String(7))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="habits")
    logs: Mapped[list["HabitLog"]] = relationship(back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    habit_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (UniqueConstraint("habit_id", "date", name="uq_habit_date"),)

    habit: Mapped["Habit"] = relationship(back_populates="logs")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(100))
    target_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[GoalStatus] = mapped_column(SAEnum(GoalStatus), default=GoalStatus.active, index=True)
    milestones: Mapped[dict | None] = mapped_column(JSONB)
    progress_pct: Mapped[int] = mapped_column(SmallInteger, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="goals")


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), index=True)
    document_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    difficulty: Mapped[Difficulty] = mapped_column(SAEnum(Difficulty), nullable=False)
    status: Mapped[QuizStatus] = mapped_column(SAEnum(QuizStatus), default=QuizStatus.generating, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    user: Mapped["User"] = relationship(back_populates="quizzes")
    course: Mapped["Course | None"] = relationship(back_populates="quizzes")
    questions: Mapped[list["QuizQuestion"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")
    attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_type: Mapped[QuestionType] = mapped_column(SAEnum(QuestionType), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[dict | None] = mapped_column(JSONB) # For multiple choice/matching
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty_score: Mapped[int] = mapped_column(SmallInteger, default=50)
    source_chunk_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("document_chunks.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    quiz: Mapped["Quiz"] = relationship(back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score: Mapped[int | None] = mapped_column(Integer)
    correct_answers: Mapped[int | None] = mapped_column(Integer)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    percentage: Mapped[int | None] = mapped_column(SmallInteger)
    time_taken_seconds: Mapped[int | None] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="quiz_attempts")
    quiz: Mapped["Quiz"] = relationship(back_populates="attempts")
    responses: Mapped[list["QuizResponse"]] = relationship(back_populates="attempt", cascade="all, delete-orphan")


class QuizResponse(Base):
    __tablename__ = "quiz_responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    user_answer: Mapped[str | None] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    confidence_score: Mapped[int | None] = mapped_column(SmallInteger) # Optional 1-5 rating
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    attempt: Mapped["QuizAttempt"] = relationship(back_populates="responses")


class TopicMastery(Base):
    __tablename__ = "topic_mastery"
    __table_args__ = (
        UniqueConstraint('user_id', 'course_id', 'topic_name', name='uq_user_course_topic'),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mastery_score: Mapped[int] = mapped_column(SmallInteger, default=0) # 0-100
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    last_assessed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="topic_mastery")
    course: Mapped["Course"] = relationship(back_populates="topic_mastery")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50))
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(SAEnum(DocumentStatus), default=DocumentStatus.processing, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    user: Mapped["User"] = relationship(back_populates="documents")
    course: Mapped["Course | None"] = relationship(back_populates="documents")
    chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped["Document"] = relationship(back_populates="chunks")


class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    target_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[RoadmapStatus] = mapped_column(SAEnum(RoadmapStatus), default=RoadmapStatus.generating, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    user: Mapped["User"] = relationship(back_populates="roadmaps")
    course: Mapped["Course | None"] = relationship(back_populates="roadmaps")
    nodes: Mapped[list["RoadmapNode"]] = relationship(back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapNode.order_index")


class RoadmapNode(Base):
    __tablename__ = "roadmap_nodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    roadmap_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("learning_roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("roadmap_nodes.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    estimated_hours: Mapped[int | None] = mapped_column(SmallInteger)
    difficulty: Mapped[NodeDifficulty] = mapped_column(SAEnum(NodeDifficulty), default=NodeDifficulty.intermediate)
    priority: Mapped[NodePriority] = mapped_column(SAEnum(NodePriority), default=NodePriority.medium)
    status: Mapped[NodeStatus] = mapped_column(SAEnum(NodeStatus), default=NodeStatus.pending)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    mastery_target: Mapped[int] = mapped_column(SmallInteger, default=80) # Percentage score to aim for
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    roadmap: Mapped["LearningRoadmap"] = relationship(back_populates="nodes")
    parent: Mapped["RoadmapNode | None"] = relationship(back_populates="children", remote_side=[id])
    children: Mapped[list["RoadmapNode"]] = relationship(back_populates="parent", cascade="all, delete-orphan")
    progress: Mapped["RoadmapProgress | None"] = relationship(back_populates="node", cascade="all, delete-orphan", uselist=False)


class RoadmapProgress(Base):
    __tablename__ = "roadmap_progress"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    roadmap_node_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("roadmap_nodes.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    completion_percentage: Mapped[int] = mapped_column(SmallInteger, default=0) # 0 to 100
    last_activity: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    node: Mapped["RoadmapNode"] = relationship(back_populates="progress")
    user: Mapped["User"] = relationship(back_populates="roadmap_progress")


class AgentMemory(Base):
    __tablename__ = "agent_memory"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    memory_type: Mapped[MemoryType] = mapped_column(SAEnum(MemoryType), default=MemoryType.long_term)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="agent_memories")


class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    period: Mapped[SnapshotPeriod] = mapped_column(SAEnum(SnapshotPeriod))
    metrics: Mapped[dict] = mapped_column(JSONB, nullable=False)
    ai_report: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (UniqueConstraint("user_id", "snapshot_date", "period", name="uq_user_snapshot"),)

    user: Mapped["User"] = relationship(back_populates="analytics_snapshots")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    user: Mapped["User"] = relationship(back_populates="conversations")
    course: Mapped["Course | None"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # 'user', 'assistant', 'system'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
