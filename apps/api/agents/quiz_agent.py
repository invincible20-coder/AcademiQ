"""Quiz Agent — generates adaptive quizzes with detailed explanations."""
from langchain_core.messages import SystemMessage, HumanMessage
from agents.model_factory import get_model

SYSTEM_PROMPT = """You are an expert assessment designer who creates highly effective quizzes.

Rules for every quiz:
- Mix question types: 40% MCQ, 20% True/False, 25% Short Answer, 15% Problem-Solving
- Each question must test ONE specific concept
- Provide 4 options for MCQ (one clearly correct, two plausible distractors, one obvious wrong)
- Explanations must teach, not just confirm — explain WHY each wrong answer is wrong
- Sequence from easier to harder to build confidence
- Include a "Key Concept" tag for each question

Output format must be valid JSON:
{
  "topic": "...",
  "difficulty": "...",
  "questions": [
    {
      "id": 1,
      "type": "mcq|true_false|short_answer|problem_solving",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A",
      "explanation": "...",
      "key_concept": "..."
    }
  ]
}"""

QUIZ_PROMPT = """Generate a quiz with these parameters:
- Topic: {topic}
- Difficulty: {difficulty}
- Focus Areas: {focus_areas}
- Number of Questions: {num_questions}

Return valid JSON only."""


async def quiz_agent_node(state: dict) -> dict:
    payload = state.get("payload", {})
    model = get_model(provider=payload.get("model_provider", "groq"), temperature=0.4)
    messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=QUIZ_PROMPT.format(**payload))]
    output_chunks = []
    async for chunk in model.astream(messages):
        if hasattr(chunk, "content"):
            output_chunks.append(chunk.content)
    output = "".join(output_chunks)
    return {**state, "output": output, "messages": state["messages"] + [{"role": "assistant", "content": output}]}
