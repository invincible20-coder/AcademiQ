"""
AcademIQ API — Settings & Configuration
All configuration via environment variables (12-factor app).
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── Environment ──────────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ── Server ───────────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://academiq.app",
    ]

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/academiq"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # ── Auth (Clerk) ─────────────────────────────────────────────────────────
    CLERK_SECRET_KEY: str = ""
    CLERK_WEBHOOK_SECRET: str = ""

    # ── AI Providers ─────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "groq"   # groq (free) or openai
    DEFAULT_GROQ_MODEL: str = "llama-3.3-70b-versatile"
    DEFAULT_OPENAI_MODEL: str = "gpt-4o"

    # ── Vector DB (Qdrant) ───────────────────────────────────────────────────
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""

    # ── Cache (Redis) ────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL_SECONDS: int = 3600  # 1 hour default

    # ── File Storage (S3/R2) ─────────────────────────────────────────────────
    S3_BUCKET_NAME: str = "academiq-documents"
    S3_ENDPOINT_URL: str = ""  # Leave empty for AWS, set for R2
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"

    # ── LangSmith (observability) ────────────────────────────────────────────
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "academiq"

    # ── Rate Limiting ────────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 30
    AGENT_RATE_LIMIT_PER_HOUR: int = 50

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
