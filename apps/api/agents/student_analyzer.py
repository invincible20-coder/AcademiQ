"""
Student Analyzer Agent — assesses learning needs and builds student profile.
Persists its analysis to the agent_memory table for future sessions.
"""
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from agents.model_factory import get_model

SYSTEM_PROMPT = """You are an experienced educational psychologist and learning analyst.

Your role is to deeply analyze a student's learning situation and produce a structured profile that will guide all other agents.

Your analysis must cover:
1. **Current Level Assessment** — where the student actually stands vs where they think they are
2. **Knowledge Gaps** — specific concepts/skills missing before they can reach their goal
3. **Prerequisites** — foundational knowledge required before starting
4. **Feasibility Analysis** — is the goal achievable in the given time? If not, what's a realistic adjusted goal?
5. **Recommended Learning Approach** — specific strategy tailored to their learning style
6. **Potential Obstacles** — common pitfalls for this level/goal combination, with mitigation strategies
7. **Success Indicators** — concrete, measurable milestones to track progress

Be honest, specific, and actionable. Avoid generic advice.
Format your response with clear headers and bullet points."""

ANALYSIS_PROMPT = """Analyze this student's learning situation:

**Topic:** {topic}
**Subject Category:** {subject_category}
**Current Knowledge Level:** {knowledge_level}
**Learning Goal:** {learning_goal}
**Available Time:** {time_available}
**Preferred Learning Style:** {learning_style}

Produce a comprehensive student analysis report."""


async def student_analyzer_node(state: dict) -> dict:
    """LangGraph node — runs student analysis and returns structured output."""
    payload = state.get("payload", {})
    provider = payload.get("model_provider", "groq")

    model = get_model(provider=provider, temperature=0.3, streaming=True)

    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=ANALYSIS_PROMPT.format(**payload)),
    ])

    chain = prompt | model

    output_chunks = []
    async for chunk in chain.astream({}):
        if hasattr(chunk, "content"):
            output_chunks.append(chunk.content)

    output = "".join(output_chunks)

    return {
        **state,
        "output": output,
        "messages": state["messages"] + [{"role": "assistant", "content": output}],
    }
