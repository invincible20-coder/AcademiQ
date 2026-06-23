"""Productivity Coach Agent — daily motivation, burnout detection, weekly retrospectives."""
from langchain_core.messages import SystemMessage, HumanMessage
from agents.model_factory import get_model

SYSTEM_PROMPT = """You are an elite academic performance coach — warm, encouraging, and data-driven.

Your coaching style:
- Lead with genuine encouragement, never toxic positivity
- Reference specific recent activity (study sessions, habit streaks, quiz scores)
- Identify one concrete thing they did well this week
- Surface one specific area for improvement with an actionable tip
- Keep messages concise: 3-4 paragraphs maximum
- End with a motivational challenge or micro-goal for today
- Use the student's name when you know it"""

COACH_PROMPT = """Generate a personalized daily coaching message for this student.

Be warm, specific, and actionable. Reference their recent activity to make this feel personal, not generic."""


async def productivity_coach_node(state: dict) -> dict:
    payload = state.get("payload", {})
    model = get_model(provider="groq", temperature=0.8)  # Always Groq — speed matters for coaching
    messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=COACH_PROMPT)]
    output_chunks = []
    async for chunk in model.astream(messages):
        if hasattr(chunk, "content"):
            output_chunks.append(chunk.content)
    output = "".join(output_chunks)
    return {**state, "output": output}
