import uuid
from typing import List, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from database.connection import get_db, AsyncSessionLocal
from database.models import QuizStatus, Difficulty, QuestionType
from ai.qdrant import get_qdrant_client, get_embeddings, get_collection_name
from qdrant_client.models import Filter, FieldCondition, MatchValue
from .repository import QuizRepository

class QuizQuestionStructured(BaseModel):
    question_type: QuestionType = Field(description="The type of question.")
    question: str = Field(description="The question text.")
    options: Optional[dict] = Field(description="JSON dictionary mapping option keys (e.g. A, B, C, D) to their values. Null if not multiple choice.")
    correct_answer: str = Field(description="The correct answer key (e.g. A) or raw string text.")
    explanation: str = Field(description="A brief explanation of why the answer is correct.")
    source_chunk_id: Optional[str] = Field(description="The UUID of the Qdrant document chunk used to generate this question, or null if general.")

class QuizStructured(BaseModel):
    questions: List[QuizQuestionStructured]

async def generate_quiz_background(
    quiz_id: uuid.UUID,
    user_id: uuid.UUID,
    course_id: Optional[uuid.UUID],
    document_id: Optional[uuid.UUID],
    title: str,
    difficulty: Difficulty,
    question_count: int,
    question_types: List[QuestionType]
):
    try:
        # 1. Retrieval
        client = get_qdrant_client()
        embeddings = get_embeddings()
        
        # We perform a generic embedding search related to the title or broad knowledge
        # Or if we just want random chunks from the doc, we can query with a generic prompt
        query_vector = await embeddings.aembed_query(title)
        
        must_filters = []
        if document_id:
            must_filters.append(FieldCondition(key="document_id", match=MatchValue(value=str(document_id))))
        elif course_id:
            must_filters.append(FieldCondition(key="course_id", match=MatchValue(value=str(course_id))))
            
        # Limit to retrieving e.g. 10 chunks to base the quiz off of
        collection_name = get_collection_name(str(user_id))
        results = client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            query_filter=Filter(must=must_filters) if must_filters else None,
            limit=10
        )
        
        context_text = ""
        chunk_map = {} # Keep track to map back source_chunk_id
        
        for r in results:
            content = r.payload.get("content", "")
            c_id = r.id # the point ID is a UUID
            context_text += f"\n--- Chunk ID: {c_id} ---\n{content}\n"
            chunk_map[c_id] = content
            
        if not context_text:
            context_text = "No specific documents found. Generate based on general academic knowledge related to the title."
            
        # 2. Generation using Structured Outputs
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)
        structured_llm = llm.with_structured_output(QuizStructured)
        
        system_prompt = f"""You are an expert Academic Assessor. 
Your task is to generate a {difficulty.value} difficulty quiz consisting of exactly {question_count} questions.
The quiz is titled: "{title}".
The requested question types are: {[q.value for q in question_types]}.

Use the following Context Chunks retrieved from the user's notes to generate the questions. 
Whenever possible, base the question ENTIRELY on a chunk and set `source_chunk_id` to that Chunk's ID.
If no chunks are provided or relevant, you may use your general knowledge and leave `source_chunk_id` null.

Context:
{context_text}
"""

        response = await structured_llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content="Generate the quiz now following the requested schema.")
        ])
        
        quiz_data = response.questions
        
        # 3. Save to Database
        async with AsyncSessionLocal() as session:
            repo = QuizRepository(session)
            
            # Prepare questions
            db_questions = []
            for q in quiz_data:
                db_questions.append({
                    "question_type": q.question_type,
                    "question": q.question,
                    "options": q.options,
                    "correct_answer": q.correct_answer,
                    "explanation": q.explanation,
                    "difficulty_score": 50, # Baseline
                    "source_chunk_id": uuid.UUID(q.source_chunk_id) if q.source_chunk_id and q.source_chunk_id != "null" else None
                })
                
            await repo.add_questions(quiz_id, db_questions)
            await repo.update_status(quiz_id, QuizStatus.ready)
            
    except Exception as e:
        print(f"Quiz Generation Error: {e}")
        async with AsyncSessionLocal() as session:
            repo = QuizRepository(session)
            await repo.update_status(quiz_id, QuizStatus.failed)
