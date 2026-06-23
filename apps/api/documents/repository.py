import uuid
from typing import Sequence, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Document, DocumentChunk, DocumentStatus

class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_document(
        self, user_id: uuid.UUID, title: str, file_name: str, file_type: str, file_size: int, storage_path: str, course_id: Optional[uuid.UUID] = None
    ) -> Document:
        doc = Document(
            user_id=user_id,
            title=title,
            file_name=file_name,
            file_type=file_type,
            file_size=file_size,
            storage_path=storage_path,
            course_id=course_id,
            status=DocumentStatus.processing
        )
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def get_document(self, doc_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Document]:
        result = await self.db.execute(
            select(Document).where(
                Document.id == doc_id,
                Document.user_id == user_id,
                Document.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def list_documents(self, user_id: uuid.UUID, course_id: Optional[uuid.UUID] = None, limit: int = 50, offset: int = 0) -> tuple[Sequence[Document], int]:
        from sqlalchemy import func
        base_query = select(Document).where(
            Document.user_id == user_id,
            Document.deleted_at.is_(None)
        )
        
        if course_id:
            base_query = base_query.where(Document.course_id == course_id)
            
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = await self.db.scalar(count_stmt) or 0
        
        query = base_query.order_by(Document.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return result.scalars().all(), total

    async def update_status(self, doc_id: uuid.UUID, status: DocumentStatus) -> None:
        result = await self.db.execute(select(Document).where(Document.id == doc_id))
        doc = result.scalar_one_or_none()
        if doc:
            doc.status = status
            await self.db.commit()

    async def save_chunks(self, document_id: uuid.UUID, chunks_data: list[dict]) -> None:
        chunks = [
            DocumentChunk(
                document_id=document_id,
                chunk_index=i,
                content=chunk["content"],
                token_count=chunk.get("token_count")
            )
            for i, chunk in enumerate(chunks_data)
        ]
        self.db.add_all(chunks)
        await self.db.commit()

    async def delete_document(self, doc_id: uuid.UUID, user_id: uuid.UUID) -> Optional[str]:
        """Returns the storage_path if deleted so the caller can remove the file"""
        doc = await self.get_document(doc_id, user_id)
        if doc:
            from datetime import datetime, timezone
            doc.deleted_at = datetime.now(timezone.utc)
            await self.db.commit()
            return doc.storage_path
        return None
