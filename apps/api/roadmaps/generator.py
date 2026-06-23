import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage

from database.connection import AsyncSessionLocal
from database.models import LearningRoadmap, RoadmapStatus, NodeDifficulty, NodePriority, NodeStatus
from roadmaps.repository import RoadmapRepository
from ai.context.aggregator import get_user_context

import os
import logging

logger = logging.getLogger(__name__)

# Structured Output Schema
class NodeOutput(BaseModel):
    title: str = Field(description="Clear, actionable title for the milestone")
    description: str = Field(description="Detailed explanation of what needs to be learned")
    estimated_hours: int = Field(description="Estimated hours to complete")
    difficulty: str = Field(description="beginner, intermediate, or advanced")
    priority: str = Field(description="low, medium, or high")
    mastery_target: int = Field(description="Target score out of 100")

class RoadmapOutput(BaseModel):
    nodes: List[NodeOutput] = Field(description="Ordered list of milestones")

# System Prompt
ROADMAP_PROMPT = """You are an elite AI Learning Architect.
Your goal is to generate a highly personalized, adaptive Learning Roadmap for the student.

You will be provided with:
1. The student's learning goal.
2. The target date to achieve this goal (if any).
3. The student's Academic Context (including their Weak Topics from recent quizzes).

Rules:
1. Break down the goal into logical, sequential learning milestones (nodes).
2. Look at the "Weak Topics" section in the User Context. If the student has low mastery scores in specific topics related to the goal, you MUST create high-priority review nodes for those topics early in the roadmap.
3. Consider the student's schedule and existing tasks to ensure the estimated hours per node are realistic.
4. Set the `mastery_target` to a sensible value (e.g., 70 for beginner concepts, 90 for core concepts).
5. Output ONLY the strictly formatted milestones as requested by the schema.
"""

async def generate_roadmap_background(roadmap_id: uuid.UUID, user_id: uuid.UUID):
    """Background task to generate a new roadmap."""
    try:
        async with AsyncSessionLocal() as db:
            repo = RoadmapRepository(db)
            roadmap = await repo.get_roadmap(roadmap_id, user_id)
            if not roadmap:
                logger.error(f"Roadmap {roadmap_id} not found")
                return
                
            # Get Context
            context = await get_user_context(db, user_id)
            
            # Prepare LLM
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
            structured_llm = llm.with_structured_output(RoadmapOutput)
            
            human_text = f"Goal: {roadmap.goal}\nTarget Date: {roadmap.target_date or 'No deadline'}\n\nContext:\n{context}"
            
            messages = [
                SystemMessage(content=ROADMAP_PROMPT),
                HumanMessage(content=human_text)
            ]
            
            # Generate
            result = await structured_llm.ainvoke(messages)
            
            # Clear any existing nodes (just in case)
            await repo.clear_roadmap_nodes(roadmap.id)
            
            # Insert Nodes
            for idx, node_data in enumerate(result.nodes):
                await repo.create_node(
                    roadmap_id=roadmap.id,
                    title=node_data.title,
                    description=node_data.description,
                    estimated_hours=node_data.estimated_hours,
                    difficulty=node_data.difficulty,
                    priority=node_data.priority,
                    order_index=idx,
                    mastery_target=node_data.mastery_target
                )
                
            # Update Status
            await repo.update_roadmap_status(roadmap.id, RoadmapStatus.active)
            logger.info(f"Roadmap {roadmap_id} generation complete.")
            
    except Exception as e:
        logger.exception(f"Failed to generate roadmap {roadmap_id}")
        async with AsyncSessionLocal() as db:
            repo = RoadmapRepository(db)
            await repo.update_roadmap_status(roadmap_id, RoadmapStatus.archived) # Mark failed/archived

async def recalculate_roadmap_background(roadmap_id: uuid.UUID, user_id: uuid.UUID):
    """
    Background task to adapt an existing roadmap based on latest TopicMastery scores.
    Currently, we'll just re-generate the whole roadmap keeping the same goal,
    but in a true production system, we'd preserve completed nodes and just rewrite the rest.
    For this implementation, we re-run generation to demonstrate adaptivity.
    """
    await generate_roadmap_background(roadmap_id, user_id)
