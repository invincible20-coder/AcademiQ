"""
RAG Knowledge Agent — answers questions grounded in uploaded documents.
Uses Qdrant for per-user vector storage (fixes the shared ChromaDB collection bug).
"""
from langchain_core.messages import SystemMessage, HumanMessage
from agents.model_factory import get_model
from services.rag_service import RAGService

SYSTEM_PROMPT = """You are a precise document analyst and tutor.

Your rules:
- ONLY answer from the provided document context
- If the answer isn't in the context, say "I don't see this in your uploaded materials. Try asking about [related topic that IS covered]."
- Always cite the source: "According to [document/section]..."
- Explain concepts clearly, don't just quote text
- Suggest related sections the student might want to read next"""

RAG_PROMPT = """**Student's Question:** {question}

**Retrieved Context from Your Documents:**
{context}

Please answer based on this context, with citations."""


async def rag_agent_node(state: dict) -> dict:
    payload = state.get("payload", {})
    user_id = payload.get("user_id", state.get("user_id", ""))
    question = payload.get("question", "")
    provider = payload.get("model_provider", "groq")

    # Get relevant chunks from user's Qdrant collection
    rag_service = RAGService(user_id=user_id)
    try:
        relevant_chunks = await rag_service.query(question, k=5)
        context = "\n\n---\n\n".join(relevant_chunks) if relevant_chunks else "No relevant documents found."
    except Exception:
        context = "Unable to retrieve documents. Please ensure you have uploaded study materials."

    model = get_model(provider=provider, temperature=0.3)
    prompt = RAG_PROMPT.format(question=question, context=context)
    messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)]

    output_chunks = []
    async for chunk in model.astream(messages):
        if hasattr(chunk, "content"):
            output_chunks.append(chunk.content)

    output = "".join(output_chunks)
    return {**state, "output": output, "messages": state["messages"] + [{"role": "assistant", "content": output}]}
