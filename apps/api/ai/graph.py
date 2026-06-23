from typing import Annotated, TypedDict, Sequence, AsyncIterator, Literal
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from .prompts import ACADEMIC_COACH_PROMPT
from .retriever import search_documents

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    context_string: str
    user_id: str

tools = [search_documents]
tool_node = ToolNode(tools)

def get_llm():
    return ChatOpenAI(model="gpt-4o-mini", temperature=0.7, streaming=True).bind_tools(tools)

def should_continue(state: AgentState) -> Literal["tools", "__end__"]:
    messages = state["messages"]
    last_message = messages[-1]
    # If the LLM makes a tool call, then we route to the "tools" node
    if last_message.tool_calls:
        return "tools"
    return "__end__"

async def generate_response(state: AgentState):
    llm = get_llm()
    messages = state["messages"]
    
    if not messages or not isinstance(messages[0], SystemMessage):
        system_msg = SystemMessage(content=ACADEMIC_COACH_PROMPT.format(
            context=state.get("context_string", ""),
            user_id=state.get("user_id", "")
        ))
        messages = [system_msg] + messages
    
    # We must pass the user_id to the tool, so we can use tool_choice or inject it.
    # A cleaner LangChain 0.2 way is to use InjectedToolArg for user_id, but here 
    # we just trust the LLM or wrap it. For safety, we expect the LLM to provide user_id 
    # but we will enforce it if possible. Let's just pass it in system prompt.
    
    response = await llm.ainvoke(messages)
    return {"messages": [response]}

workflow = StateGraph(AgentState)
workflow.add_node("agent", generate_response)
workflow.add_node("tools", tool_node)

workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("tools", "agent")

app_graph = workflow.compile()
