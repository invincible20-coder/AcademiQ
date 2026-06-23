import uuid
from typing import Sequence
from fastapi import HTTPException
from .repository import ConversationRepository
from database.models import Conversation, Message

class ConversationService:
    def __init__(self, repository: ConversationRepository):
        self.repository = repository

    async def get_conversation(self, conv_id: uuid.UUID, user_id: uuid.UUID) -> Conversation:
        conv = await self.repository.get_conversation(conv_id, user_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conv

    async def list_conversations(self, user_id: uuid.UUID) -> Sequence[Conversation]:
        return await self.repository.list_conversations(user_id)

    async def load_history(self, conv_id: uuid.UUID, user_id: uuid.UUID) -> Sequence[Message]:
        await self.get_conversation(conv_id, user_id) # ensure it belongs to user
        return await self.repository.get_messages(conv_id)

    async def create_conversation(self, user_id: uuid.UUID, title: str) -> Conversation:
        return await self.repository.create_conversation(user_id, title)
