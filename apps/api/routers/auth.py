"""
Auth router — handles Clerk webhooks to sync users into our DB.
"""
from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from svix.webhooks import Webhook, WebhookVerificationError

from database.connection import get_db
from database.models import User
from config import settings

router = APIRouter()


@router.post("/webhook/clerk")
async def clerk_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Receives Clerk webhook events and syncs user data.
    Verifies webhook signature using svix.
    """
    payload = await request.body()
    headers = dict(request.headers)

    # Verify webhook signature
    try:
        wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
        event = wh.verify(payload, headers)
    except WebhookVerificationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    event_type = event.get("type")
    data = event.get("data", {})

    if event_type == "user.created":
        # Create user in our DB
        email = data.get("email_addresses", [{}])[0].get("email_address", "")
        user = User(
            clerk_id=data["id"],
            email=email,
            display_name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or None,
            avatar_url=data.get("image_url"),
        )
        db.add(user)
        await db.commit()

    elif event_type == "user.updated":
        result = await db.execute(select(User).where(User.clerk_id == data["id"]))
        user = result.scalar_one_or_none()
        if user:
            email = data.get("email_addresses", [{}])[0].get("email_address", "")
            user.email = email
            user.display_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or None
            user.avatar_url = data.get("image_url")
            await db.commit()

    elif event_type == "user.deleted":
        result = await db.execute(select(User).where(User.clerk_id == data["id"]))
        user = result.scalar_one_or_none()
        if user:
            await db.delete(user)
            await db.commit()

    return {"status": "processed"}
