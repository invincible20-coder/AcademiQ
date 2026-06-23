"""
Auth dependency — extracts and validates Clerk JWT from request headers.
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

import jwt
from jwt import PyJWKClient
import logging

from database.connection import get_db
from database.models import User
from config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer()

class ClerkJWKS:
    """Singleton to cache JWKS keys from Clerk to prevent network requests on every validation."""
    _jwks_client = None

    @classmethod
    def get_client(cls):
        if cls._jwks_client is None:
            # Clerk provides the JWKS endpoint
            jwks_url = "https://api.clerk.com/v1/jwks"
            cls._jwks_client = PyJWKClient(jwks_url)
        return cls._jwks_client

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validates Clerk JWT locally using JWKS and returns the corresponding User from DB.
    Raises 401 if token is invalid, 404 if user not found.
    """
    token = credentials.credentials

    try:
        jwks_client = ClerkJWKS.get_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        data = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False}  # Adjust if audience verification is strictly required
        )
        clerk_id = data.get("sub")
        if not clerk_id:
            raise ValueError("Token missing 'sub' claim")
            
    except Exception as e:
        logger.error(f"JWT Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    # Look up user in our DB
    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found — please complete onboarding",
        )

    return user
