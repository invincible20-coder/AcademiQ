"""
Shared model factory — creates LangChain LLM instances based on provider.
Replaces the Phidata _get_model() method across all agents.
"""
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_anthropic import ChatAnthropic
from langchain_core.language_models import BaseChatModel
from config import settings


def get_model(
    provider: str | None = None,
    temperature: float = 0.7,
    streaming: bool = True,
) -> BaseChatModel:
    """
    Returns a configured LangChain chat model.

    Args:
        provider: "groq" | "openai" | "anthropic" (defaults to settings)
        temperature: sampling temperature
        streaming: whether to enable streaming output
    """
    p = provider or settings.DEFAULT_LLM_PROVIDER

    if p == "groq":
        return ChatGroq(
            model=settings.DEFAULT_GROQ_MODEL,
            temperature=temperature,
            streaming=streaming,
            api_key=settings.GROQ_API_KEY,
        )
    elif p == "openai":
        return ChatOpenAI(
            model=settings.DEFAULT_OPENAI_MODEL,
            temperature=temperature,
            streaming=streaming,
            api_key=settings.OPENAI_API_KEY,
        )
    elif p == "anthropic":
        return ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            temperature=temperature,
            streaming=streaming,
            api_key=settings.ANTHROPIC_API_KEY,
        )
    else:
        raise ValueError(f"Unknown provider: {p}. Use 'groq', 'openai', or 'anthropic'.")
