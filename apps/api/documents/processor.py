import uuid
from typing import Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_qdrant import QdrantVectorStore
from qdrant_client.models import PointStruct
from pypdf import PdfReader

from ai.qdrant import get_qdrant_client, get_embeddings, COLLECTION_NAME, init_qdrant
from database.connection import get_db
from database.models import DocumentStatus
from .repository import DocumentRepository

def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

async def process_document_background(
    doc_id: uuid.UUID,
    user_id: uuid.UUID,
    course_id: Optional[uuid.UUID],
    file_path: str,
    file_type: str
):
    # Initialize Qdrant collection if not exists
    init_qdrant()

    try:
        # 1. Extract Text
        text = ""
        if file_type.lower() == "pdf":
            text = extract_text_from_pdf(file_path)
        else:
            text = extract_text_from_txt(file_path)

        # 2. Chunking
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks = splitter.split_text(text)

        # 3. Embeddings & Upsert to Qdrant
        q_client = get_qdrant_client()
        embeddings_model = get_embeddings()
        
        # Batch embed and upload to Qdrant
        points = []
        chunks_data = []
        for i, chunk in enumerate(chunks):
            vector = await embeddings_model.aembed_query(chunk)
            payload = {
                "user_id": str(user_id),
                "document_id": str(doc_id),
                "course_id": str(course_id) if course_id else None,
                "chunk_index": i,
                "content": chunk
            }
            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload=payload
                )
            )
            chunks_data.append({"content": chunk, "token_count": len(chunk.split())}) # simple token estimate

        if points:
            q_client.upsert(
                collection_name=COLLECTION_NAME,
                points=points
            )

        # 4. Update Database
        async for session in get_db():
            repo = DocumentRepository(session)
            await repo.save_chunks(doc_id, chunks_data)
            await repo.update_status(doc_id, DocumentStatus.ready)
            break # only one session needed

    except Exception as e:
        print(f"Error processing document {doc_id}: {e}")
        async for session in get_db():
            repo = DocumentRepository(session)
            await repo.update_status(doc_id, DocumentStatus.failed)
            break
