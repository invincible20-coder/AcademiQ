"""
Tutor Agent — real-time tutoring with streaming responses.
Maintains conversation history via LangGraph checkpointing.
"""
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from agents.model_factory import get_model

SYSTEM_PROMPT = """You are a world-class tutor — patient, brilliant, and deeply empathetic.

Your teaching philosophy:
- Meet students exactly where they are, never where you wish they were
- Use the Socratic method: guide with questions, don't just provide answers
- Every abstract concept needs a concrete real-world analogy
- Celebrate confusion — it means the student is at the edge of their understanding
- Never say "as I mentioned" or "obviously" — every student is encountering this fresh

Your response structure:
1. **Direct Answer** — address the question clearly in 1-2 sentences
2. **The Explanation** — break it down step by step
3. **Analogy/Example** — make it tangible and memorable
4. **Check for Understanding** — ask a follow-up question to verify comprehension
5. **Next Step** — what should they explore next?

Always adapt your language complexity to the student's knowledge level."""

TUTOR_PROMPT = """**Student's Question:** {question}

**Topic Context:** {topic}
**Student's Knowledge Level:** {knowledge_level}
**Additional Context:** {context}

Please provide a clear, engaging tutoring response."""


async def tutor_agent_node(state: dict) -> dict:
    """LangGraph node — runs tutor session with conversation history."""
    payload = state.get("payload", {})
    provider = payload.get("model_provider", "groq")

    model = get_model(provider=provider, temperature=0.7, streaming=True)

    # Include conversation history for continuity
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for msg in state.get("messages", [])[-10:]:  # Last 10 messages for context window
        if isinstance(msg, dict):
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(msg)

    messages.append(HumanMessage(content=TUTOR_PROMPT.format(**payload)))

    output_chunks = []
    async for chunk in model.astream(messages):
        if hasattr(chunk, "content"):
            output_chunks.append(chunk.content)

    output = "".join(output_chunks)

    return {
        **state,
        "output": output,
        "messages": state["messages"] + [{"role": "assistant", "content": output}],
    }
