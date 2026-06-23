import uuid
from typing import Optional, Annotated
from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from qdrant_client.models import Filter, FieldCondition, MatchValue
from .qdrant import get_qdrant_client, COLLECTION_NAME

@tool
async def search_documents(query: str, user_id: Annotated[str, InjectedState("user_id")], course_id: Optional[str] = None) -> str:
    """Searches the user's uploaded documents (PDFs, Notes) for information.
    Use this tool whenever the user asks about their notes, course materials, or uploaded files.
    """
    client = get_qdrant_client()
    
    from .qdrant import get_embeddings
    embeddings = get_embeddings()
    query_vector = await embeddings.aembed_query(query)
    
    # Must filter by user_id for multi-tenant isolation
    must_filters = [
        FieldCondition(
            key="user_id",
            match=MatchValue(value=user_id)
        )
    ]
    
    if course_id:
        must_filters.append(
            FieldCondition(
                key="course_id",
                match=MatchValue(value=course_id)
            )
        )
        
    results = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=Filter(must=must_filters),
        limit=5
    )
    
    if not results:
        return "No relevant documents found."
        
    context_chunks = []
    for r in results:
        payload = r.payload
        doc_id = payload.get("document_id", "Unknown")
        content = payload.get("content", "")
        # Return structured citation
        context_chunks.append(f"Source Document ID: {doc_id}\nContent: {content}\n")
        
    return "\n\n".join(context_chunks)
