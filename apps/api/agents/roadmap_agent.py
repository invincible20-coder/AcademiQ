"""Roadmap Agent — generates personalized, phased learning roadmaps."""
from langchain_core.messages import SystemMessage, HumanMessage
from agents.model_factory import get_model

SYSTEM_PROMPT = """You are a master curriculum designer who creates laser-precise learning roadmaps.

Every roadmap you create must:
- Have exactly 5-7 phases, from foundational to mastery
- Each phase must have: name, duration estimate, 3-5 specific objectives, 2-3 practice exercises, and a clear completion checkpoint
- Be sequenced so each phase's prerequisites are covered by the previous phase
- Include realistic time estimates based on the student's available hours
- Have built-in review sessions every 2 phases
- End with a capstone project or final assessment

Format your roadmap in clean Markdown with emoji phase markers (🟢 Foundation → 🟡 Building → 🟠 Intermediate → 🔴 Advanced → 🏆 Mastery)."""

ROADMAP_PROMPT = """Create a detailed learning roadmap for:

**Topic:** {topic}
**Learning Goal:** {learning_goal}
**Knowledge Level:** {knowledge_level}
**Time Available:** {time_available}

{student_analysis_section}

Generate a complete, actionable roadmap."""


async def roadmap_agent_node(state: dict) -> dict:
    payload = state.get("payload", {})
    analysis = payload.get("student_analysis", "")
    analysis_section = f"**Prior Analysis:**\n{analysis}" if analysis else ""

    model = get_model(provider=payload.get("model_provider", "groq"), temperature=0.6)

    prompt_text = ROADMAP_PROMPT.format(**{**payload, "student_analysis_section": analysis_section})
    messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt_text)]

    output_chunks = []
    async for chunk in model.astream(messages):
        if hasattr(chunk, "content"):
            output_chunks.append(chunk.content)

    output = "".join(output_chunks)
    return {**state, "output": output, "messages": state["messages"] + [{"role": "assistant", "content": output}]}
