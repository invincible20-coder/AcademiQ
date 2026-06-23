import re

def refactor_models():
    path = "/Users/swaransh/Desktop/ok ok/academiq/apps/api/database/models.py"
    with open(path, "r") as f:
        content = f.read()

    # 1. Update User relationships
    content = content.replace(
        'subjects: Mapped[list["Subject"]] = relationship(back_populates="user", cascade="all, delete-orphan")',
        'courses: Mapped[list["Course"]] = relationship(back_populates="user", cascade="all, delete-orphan")'
    )

    # 2. Replace Subject model
    subject_model_old = """class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(50))
    teacher: Mapped[str | None] = mapped_column(String(255))
    color: Mapped[str | None] = mapped_column(String(7))
    category: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="subjects")
    classes: Mapped[list["ClassSchedule"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    roadmaps: Mapped[list["LearningRoadmap"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    quiz_results: Mapped[list["QuizResult"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="subject", cascade="all, delete-orphan")"""

    course_model_new = """class Course(Base):
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
    classes: Mapped[list["ClassSchedule"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    roadmaps: Mapped[list["LearningRoadmap"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    study_sessions: Mapped[list["StudySession"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    quiz_results: Mapped[list["QuizResult"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="course", cascade="all, delete-orphan")"""

    content = content.replace(subject_model_old, course_model_new)

    # 3. Replace ClassSchedule
    content = content.replace(
        'subject_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="SET NULL"))',
        'course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"))'
    )
    content = content.replace(
        'subject: Mapped["Subject | None"] = relationship(back_populates="classes")',
        'course: Mapped["Course | None"] = relationship(back_populates="classes")'
    )

    # 4. Replace Assignment
    content = content.replace(
        'subject_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="SET NULL"), index=True)',
        'course_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), index=True)'
    )
    content = content.replace(
        'subject: Mapped["Subject | None"] = relationship(back_populates="assignments")',
        'course: Mapped["Course | None"] = relationship(back_populates="assignments")'
    )

    # 5. Replace LearningRoadmap
    content = content.replace(
        'subject: Mapped["Subject | None"] = relationship(back_populates="roadmaps")',
        'course: Mapped["Course | None"] = relationship(back_populates="roadmaps")'
    )

    # 6. Replace StudySession
    content = content.replace(
        'subject: Mapped["Subject | None"] = relationship(back_populates="study_sessions")',
        'course: Mapped["Course | None"] = relationship(back_populates="study_sessions")'
    )

    # 7. Replace QuizResult
    content = content.replace(
        'subject: Mapped["Subject | None"] = relationship(back_populates="quiz_results")',
        'course: Mapped["Course | None"] = relationship(back_populates="quiz_results")'
    )

    # 8. Replace Document
    content = content.replace(
        'subject: Mapped["Subject | None"] = relationship(back_populates="documents")',
        'course: Mapped["Course | None"] = relationship(back_populates="documents")'
    )

    with open(path, "w") as f:
        f.write(content)
    print("Models updated.")

if __name__ == "__main__":
    refactor_models()
