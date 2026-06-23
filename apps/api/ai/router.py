import uuid
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.messages import HumanMessage, AIMessage

from database.connection import get_db
from database.models import User
from routers.deps import get_current_user

from .conversations.repository import ConversationRepository
from .conversations.service import ConversationService
from .context.aggregator import get_user_context
from .graph import app_graph

router = APIRouter()

def get_conversation_service(db: AsyncSession = Depends(get_db)) -> ConversationService:
    repo = ConversationRepository(db)
    return ConversationService(repo)

class ConversationCreate(BaseModel):
    title: str
    course_id: Optional[uuid.UUID] = None

class ConversationRename(BaseModel):
    title: str

class ChatMessage(BaseModel):
    content: str

@router.get("/conversations")
async def list_conversations(
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service)
):
    return await service.list_conversations(current_user.id)

@router.post("/conversations")
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service)
):
    return await service.create_conversation(current_user.id, data.title)

@router.get("/conversations/{conv_id}")
async def get_conversation_history(
    conv_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service)
):
    return await service.load_history(conv_id, current_user.id)

@router.patch("/conversations/{conv_id}")
async def rename_conversation(
    conv_id: uuid.UUID,
    data: ConversationRename,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service)
):
    conv = await service.repository.rename_conversation(conv_id, current_user.id, data.title)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/conversations/{conv_id}")
async def delete_conversation(
    conv_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service)
):
    await service.repository.delete_conversation(conv_id, current_user.id)
    return {"status": "deleted"}

@router.post("/chat/{conv_id}")
async def chat_stream(
    conv_id: uuid.UUID,
    message: ChatMessage,
    current_user: User = Depends(get_current_user),
    service: ConversationService = Depends(get_conversation_service),
    db: AsyncSession = Depends(get_db)
):
    # 1. Validate conversation belongs to user
    await service.get_conversation(conv_id, current_user.id)
    
    # 2. Persist user message
    await service.repository.add_message(conv_id, "user", message.content)
    
    # 3. Fetch past messages for context
    history = await service.load_history(conv_id, current_user.id)
    lc_messages = []
    for m in history:
        if m.role == "user":
            lc_messages.append(HumanMessage(content=m.content))
        elif m.role == "assistant":
            lc_messages.append(AIMessage(content=m.content))
            
    # 4. Fetch context
    context_str = await get_user_context(db, current_user.id)

    async def sse_generator():
        state = {
            "messages": lc_messages,
            "context_string": context_str,
            "user_id": str(current_user.id)
        }
        
        full_response = ""
        try:
            async for event in app_graph.astream_events(state, version="v2"):
                kind = event["event"]
                if kind == "on_chat_model_stream":
                    chunk = event["data"]["chunk"].content
                    if chunk:
                        full_response += chunk
                        # Send SSE chunk
                        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                        
            # End of stream marker
            yield f"data: [DONE]\n\n"
            
            # Persist AI message after generation
            await service.repository.add_message(conv_id, "assistant", full_response)
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")
