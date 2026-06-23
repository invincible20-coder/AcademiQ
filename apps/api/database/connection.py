"""
Database connection and session management.
Uses SQLAlchemy async engine with PostgreSQL.
"""
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from config import settings

# ─── Engine ───────────────────────────────────────────────────────────────────

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ─── Base Model ───────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ─── Dependency ───────────────────────────────────────────────────────────────

async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─── Startup ──────────────────────────────────────────────────────────────────

async def init_db():
    """Verify database connectivity on startup."""
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    print("✅ Database connection verified")
