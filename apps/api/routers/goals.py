"""Stub routers — to be fully implemented in subsequent phases."""
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def placeholder():
    return {"status": "coming_soon"}
