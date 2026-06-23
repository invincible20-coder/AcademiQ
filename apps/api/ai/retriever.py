import uuid
from typing import Optional, Annotated
from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from qdrant_client.models import Filter, FieldCondition, MatchValue
from .qdrant import get_qdrant_client, get_collection_name

@tool
async def search_documents(query: str, user_id: Annotated[str, InjectedState("user_id")], course_id: Optional[str] = None) -> str:
    """Searches the user's uploaded documents (PDFs, Notes) for information.
    Use this tool whenever the user asks about their notes, course materials, or uploaded files.
    """
    if not user_id or not str(user_id).strip():
        return "Error: user identity could not be verified."
        
    client = get_qdrant_client()
    collection_name = get_collection_name(str(user_id))
    
    from .qdrant import get_embeddings
    embeddings = get_embeddings()
    query_vector = await embeddings.aembed_query(query)
    
    must_filters = []
    
    if course_id:
        must_filters.append(
            FieldCondition(
                key="course_id",
                match=MatchValue(value=str(course_id))
            )
        )
        
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=Filter(must=must_filters) if must_filters else None,
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
