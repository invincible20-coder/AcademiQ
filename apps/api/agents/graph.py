"""
LangGraph Multi-Agent Supervisor Graph.
Replaces the monolithic Phidata StudyAgents class with a proper
stateful graph that supports persistent memory and streaming.
"""
from typing import TypedDict, Annotated, Literal, AsyncIterator
import operator

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from config import settings
from agents.student_analyzer import student_analyzer_node
from agents.roadmap_agent import roadmap_agent_node
from agents.tutor_agent import tutor_agent_node
from agents.quiz_agent import quiz_agent_node
from agents.resource_researcher import resource_researcher_node
from agents.rag_agent import rag_agent_node
from agents.productivity_coach import productivity_coach_node


# ─── Graph State ─────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    user_id: str
    agent_type: str
    payload: dict
    output: str


# ─── Supervisor Router ────────────────────────────────────────────────────────

def route_to_agent(state: AgentState) -> Literal[
    "student_analyzer", "roadmap_agent", "tutor_agent",
    "quiz_agent", "resource_researcher", "rag_agent", "productivity_coach", END
]:
    """Routes the request to the correct specialized agent."""
    agent_type = state.get("agent_type", "")
    routing_map = {
        "student_analyzer": "student_analyzer",
        "roadmap_agent": "roadmap_agent",
        "tutor_agent": "tutor_agent",
        "quiz_agent": "quiz_agent",
        "resource_researcher": "resource_researcher",
        "rag_agent": "rag_agent",
        "productivity_coach": "productivity_coach",
    }
    return routing_map.get(agent_type, END)


# ─── Graph Construction ───────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    # Add all agent nodes
    graph.add_node("student_analyzer", student_analyzer_node)
    graph.add_node("roadmap_agent", roadmap_agent_node)
    graph.add_node("tutor_agent", tutor_agent_node)
    graph.add_node("quiz_agent", quiz_agent_node)
    graph.add_node("resource_researcher", resource_researcher_node)
    graph.add_node("rag_agent", rag_agent_node)
    graph.add_node("productivity_coach", productivity_coach_node)

    # Routing: entry point routes to specialized agent
    graph.set_conditional_entry_point(route_to_agent)

    # All agents end after execution
    for node in ["student_analyzer", "roadmap_agent", "tutor_agent",
                 "quiz_agent", "resource_researcher", "rag_agent", "productivity_coach"]:
        graph.add_edge(node, END)

    return graph


# ─── Compiled Graph with Memory ──────────────────────────────────────────────

_checkpointer = MemorySaver()
_graph = build_graph().compile(checkpointer=_checkpointer)


# ─── Public Interface ────────────────────────────────────────────────────────

async def run_agent_stream(
    agent_type: str,
    payload: dict,
    user_id: str,
) -> AsyncIterator[str]:
    """
    Streams tokens from the specified agent.
    Uses LangGraph checkpointing keyed by user_id for persistent memory.
    """
    config = {
        "configurable": {"thread_id": f"{user_id}:{agent_type}"},
        "recursion_limit": 10,
    }

    initial_state: AgentState = {
        "messages": [HumanMessage(content=str(payload))],
        "user_id": user_id,
        "agent_type": agent_type,
        "payload": payload,
        "output": "",
    }

    async for event in _graph.astream(initial_state, config=config):
        for node_name, node_output in event.items():
            if node_name != "__end__" and isinstance(node_output, dict):
                output = node_output.get("output", "")
                if output:
                    # Yield chunks for streaming
                    for chunk in output.split(" "):
                        yield chunk + " "
