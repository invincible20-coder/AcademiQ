import uuid
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.connection import get_db
from database.models import User, DocumentChunk
from routers.deps import get_current_user
from .schemas import DocumentResponse
from .repository import DocumentRepository
from .storage import LocalStorage
from .processor import process_document_background

router = APIRouter()

def get_document_repository(db: AsyncSession = Depends(get_db)) -> DocumentRepository:
    return DocumentRepository(db)

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    course_id: Optional[uuid.UUID] = Form(None),
    current_user: User = Depends(get_current_user),
    repo: DocumentRepository = Depends(get_document_repository)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")
    
    file_ext = os.path.splitext(file.filename)[1].lower().replace(".", "")
    if file_ext not in ["pdf", "txt", "md"]:
        raise HTTPException(status_code=400, detail="Only PDF, TXT, and MD files are supported currently")
        
    # Read file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 25MB allowed.")

    # 1. Save File to local storage
    storage_path = await LocalStorage.save_upload_file(file, current_user.id)
    
    # 2. Create DB Entry
    doc = await repo.create_document(
        user_id=current_user.id,
        title=file.filename, # Using filename as initial title
        file_name=file.filename,
        file_type=file_ext,
        file_size=file_size,
        storage_path=storage_path,
        course_id=course_id
    )
    
    # 3. Schedule Background Processing
    background_tasks.add_task(
        process_document_background,
        doc_id=doc.id,
        user_id=current_user.id,
        course_id=course_id,
        file_path=storage_path,
        file_type=file_ext
    )
    
    return doc

from .schemas import DocumentResponse, DocumentPaginatedResponse

@router.get("/", response_model=DocumentPaginatedResponse)
async def list_documents(
    course_id: Optional[uuid.UUID] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    repo: DocumentRepository = Depends(get_document_repository)
):
    items, total = await repo.list_documents(current_user.id, course_id, limit, offset)
    return {"items": items, "total": total, "limit": limit, "offset": offset}

@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    repo: DocumentRepository = Depends(get_document_repository)
):
    doc = await repo.get_document(doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/{doc_id}/chunks")
async def get_document_chunks(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    repo: DocumentRepository = Depends(get_document_repository)
):
    doc = await repo.get_document(doc_id, current_user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Lazy loading chunks from db
    result = await repo.db.execute(
        select(DocumentChunk).where(DocumentChunk.document_id == doc_id).order_by(DocumentChunk.chunk_index.asc())
    )
    chunks = result.scalars().all()
    return [{"index": c.chunk_index, "content": c.content, "token_count": c.token_count} for c in chunks]

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    repo: DocumentRepository = Depends(get_document_repository)
):
    storage_path = await repo.delete_document(doc_id, current_user.id)
    if not storage_path:
        raise HTTPException(status_code=404, detail="Document not found")
        
    LocalStorage.delete_file(storage_path)
    
    # Note: We don't delete from Qdrant immediately to avoid slow API responses.
    # In a full production system, a separate cron job would prune deleted embeddings.
    
    return {"status": "deleted"}
