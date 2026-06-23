"""Resource Researcher Agent — finds and curates learning materials using DuckDuckGo."""
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_community.tools import DuckDuckGoSearchRun
from agents.model_factory import get_model

SYSTEM_PROMPT = """You are a research specialist who finds the very best learning resources.

Your curation standards:
- Only recommend resources you can verify exist
- Prioritize free resources; mark paid ones clearly
- Match resource format to the student's learning style
- Organize by learning phase (Beginner → Intermediate → Advanced)
- Include: name, URL, type (video/book/course/article/interactive), cost, why recommended

Format as clean Markdown with emoji type indicators:
🎥 Video | 📚 Book | 🎓 Course | 📄 Article | 💻 Interactive | 🎙️ Podcast"""

RESOURCE_PROMPT = """Find the best learning resources for:
- Topic: {topic}
- Knowledge Level: {knowledge_level}
- Learning Style: {learning_style}
- Goal: {learning_goal}

Search the web and return a curated, organized resource list."""


async def resource_researcher_node(state: dict) -> dict:
    payload = state.get("payload", {})
    provider = payload.get("model_provider", "groq")
    model = get_model(provider=provider, temperature=0.5)
    search = DuckDuckGoSearchRun()

    # Search for resources
    query = f"best resources to learn {payload.get('topic', '')} for {payload.get('knowledge_level', 'beginner')}"
    try:
        search_results = search.run(query)
    except Exception:
        search_results = "Search unavailable. Providing recommendations based on training knowledge."

    prompt = f"{RESOURCE_PROMPT.format(**payload)}\n\nSearch Results:\n{search_results}"
    messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)]

    output_chunks = []
    async for chunk in model.astream(messages):
        if hasattr(chunk, "content"):
            output_chunks.append(chunk.content)

    output = "".join(output_chunks)
    return {**state, "output": output, "messages": state["messages"] + [{"role": "assistant", "content": output}]}
