"""
AcademIQ API — Main Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from config import settings
from database.connection import init_db
from routers import (
    auth,
    assignments,
    habits,
    goals,
    study,
    agents,
    analytics,
)
from tasks.router import router as tasks_router
from courses.router import router as courses_router
from schedule.router import router as schedule_router
from ai.router import router as ai_router
from documents.router import router as documents_router
from quizzes.router import router as quizzes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Startup
    await init_db()
    print(f"✅ AcademIQ API started — environment: {settings.ENVIRONMENT}")
    yield
    # Shutdown
    print("🛑 AcademIQ API shutting down...")


app = FastAPI(
    title="AcademIQ API",
    description="AI-Powered Academic Operating System — Backend API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# ─── Middleware ───────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ─── Routers ─────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth.router,        prefix=f"{API_PREFIX}/auth",        tags=["auth"])
app.include_router(courses_router,     prefix=f"{API_PREFIX}/courses",     tags=["courses"])
app.include_router(assignments.router, prefix=f"{API_PREFIX}/assignments", tags=["assignments"])
app.include_router(schedule_router,    prefix=f"{API_PREFIX}/schedule",    tags=["schedule"])
app.include_router(habits.router,      prefix=f"{API_PREFIX}/habits",      tags=["habits"])
app.include_router(goals.router,       prefix=f"{API_PREFIX}/goals",       tags=["goals"])
app.include_router(study.router,       prefix=f"{API_PREFIX}/study",       tags=["study"])
app.include_router(ai_router,          prefix=f"{API_PREFIX}/ai",          tags=["ai"])
app.include_router(documents_router,   prefix=f"{API_PREFIX}/documents",   tags=["documents"])
app.include_router(quizzes_router,     prefix=f"{API_PREFIX}/quizzes",     tags=["quizzes"])
app.include_router(agents.router,      prefix=f"{API_PREFIX}/agents",      tags=["agents"])
app.include_router(analytics.router,   prefix=f"{API_PREFIX}/analytics",   tags=["analytics"])
app.include_router(tasks_router,       prefix=f"{API_PREFIX}/tasks",       tags=["tasks"])


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
