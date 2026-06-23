import uuid
from typing import Optional, Sequence
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Conversation, Message

class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_conversation(self, user_id: uuid.UUID, title: str, course_id: Optional[uuid.UUID] = None) -> Conversation:
        conv = Conversation(user_id=user_id, title=title, course_id=course_id)
        self.db.add(conv)
        await self.db.commit()
        await self.db.refresh(conv)
        return conv

    async def get_conversation(self, conv_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Conversation]:
        result = await self.db.execute(
            select(Conversation).where(
                Conversation.id == conv_id,
                Conversation.user_id == user_id,
                Conversation.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def list_conversations(self, user_id: uuid.UUID) -> Sequence[Conversation]:
        result = await self.db.execute(
            select(Conversation).where(
                Conversation.user_id == user_id,
                Conversation.deleted_at.is_(None)
            ).order_by(Conversation.updated_at.desc())
        )
        return result.scalars().all()

    async def get_messages(self, conv_id: uuid.UUID) -> Sequence[Message]:
        result = await self.db.execute(
            select(Message).where(
                Message.conversation_id == conv_id
            ).order_by(Message.created_at.asc())
        )
        return result.scalars().all()

    async def add_message(self, conv_id: uuid.UUID, role: str, content: str) -> Message:
        msg = Message(conversation_id=conv_id, role=role, content=content)
        self.db.add(msg)
        
        # update conversation updated_at
        await self.db.execute(
            update(Conversation).where(Conversation.id == conv_id).values(updated_at=msg.created_at)
        )
        await self.db.commit()
        await self.db.refresh(msg)
        return msg

    async def delete_conversation(self, conv_id: uuid.UUID, user_id: uuid.UUID) -> None:
        conv = await self.get_conversation(conv_id, user_id)
        if conv:
            from datetime import datetime, timezone
            conv.deleted_at = datetime.now(timezone.utc)
            await self.db.commit()

    async def rename_conversation(self, conv_id: uuid.UUID, user_id: uuid.UUID, title: str) -> Optional[Conversation]:
        conv = await self.get_conversation(conv_id, user_id)
        if conv:
            conv.title = title
            await self.db.commit()
            await self.db.refresh(conv)
        return conv
