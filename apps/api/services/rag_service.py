"""
RAG Service — Qdrant vector store management with per-user isolation.
Fixes: shared ChromaDB collection, local disk persistence, OpenAI-only embeddings.
"""
import uuid
from typing import List, Optional
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_openai import OpenAIEmbeddings
from config import settings

VECTOR_SIZE = 1536  # OpenAI text-embedding-3-small


class RAGService:
    """
    Per-user RAG service backed by Qdrant.

    Each user gets their own Qdrant collection named: user_{user_id}
    This fixes the critical shared-collection vulnerability in the original code.
    """

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.collection_name = f"user_{user_id.replace('-', '_')}"
        self.client = AsyncQdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY or None,
        )
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=settings.OPENAI_API_KEY,
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )

    async def ensure_collection(self):
        """Create Qdrant collection if it doesn't exist."""
        collections = await self.client.get_collections()
        names = [c.name for c in collections.collections]

        if self.collection_name not in names:
            await self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )

    async def load_pdf(self, file_path: str, document_id: str) -> int:
        """Load a PDF, chunk it, embed, and store in Qdrant. Returns chunk count."""
        await self.ensure_collection()

        loader = PyPDFLoader(file_path)
        docs = loader.load()
        chunks = self.text_splitter.split_documents(docs)

        if not chunks:
            return 0

        texts = [c.page_content for c in chunks]
        vectors = await self.embeddings.aembed_documents(texts)

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "text": text,
                    "document_id": document_id,
                    "user_id": self.user_id,
                    "chunk_index": i,
                },
            )
            for i, (text, vector) in enumerate(zip(texts, vectors))
        ]

        await self.client.upsert(collection_name=self.collection_name, points=points)
        return len(points)

    async def load_text(self, file_path: str, document_id: str) -> int:
        """Load a text file, chunk, embed, and store. Returns chunk count."""
        await self.ensure_collection()

        loader = TextLoader(file_path)
        docs = loader.load()
        chunks = self.text_splitter.split_documents(docs)

        if not chunks:
            return 0

        texts = [c.page_content for c in chunks]
        vectors = await self.embeddings.aembed_documents(texts)

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={"text": text, "document_id": document_id, "user_id": self.user_id, "chunk_index": i},
            )
            for i, (text, vector) in enumerate(zip(texts, vectors))
        ]

        await self.client.upsert(collection_name=self.collection_name, points=points)
        return len(points)

    async def query(self, question: str, k: int = 5) -> List[str]:
        """Similarity search — returns top-k relevant text chunks."""
        await self.ensure_collection()

        query_vector = await self.embeddings.aembed_query(question)
        results = await self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=k,
            score_threshold=0.3,
        )

        return [r.payload.get("text", "") for r in results if r.payload]

    async def delete_document(self, document_id: str) -> bool:
        """Remove all chunks for a specific document."""
        await self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            ),
        )
        return True

    async def clear_all(self) -> bool:
        """Delete the entire user collection."""
        await self.client.delete_collection(self.collection_name)
        return True

    async def get_chunk_count(self) -> int:
        """Return total number of stored chunks."""
        try:
            info = await self.client.get_collection(self.collection_name)
            return info.points_count or 0
        except Exception:
            return 0
