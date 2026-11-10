"""Claude API calls for the assistant (streaming chat) and the 5 Ws Project Scoper (structured output)."""

from __future__ import annotations

import time
from collections.abc import AsyncIterator
from typing import Any, Literal

import anthropic
from pydantic import BaseModel, Field

from app.ai.knowledge import ASSISTANT_INSTRUCTIONS, SCOPER_INSTRUCTIONS
from app.ai.limits import cost_usd, ledger, settings

_client: anthropic.AsyncAnthropic | None = None


def client() -> anthropic.AsyncAnthropic:
    """Create the client lazily so the app still starts when no key is configured."""
    global _client
    if _client is None:
        # Reads ANTHROPIC_API_KEY from the environment; the key never leaves the server.
        _client = anthropic.AsyncAnthropic(timeout=60.0, max_retries=2)
    return _client


def _cached_system(text: str) -> list[dict[str, Any]]:
    # The instructions + knowledge are identical on every request, so mark them for prompt caching:
    # repeat visitors pay about a tenth of the input price for this part.
    return [{"type": "text", "text": text, "cache_control": {"type": "ephemeral"}}]


def _usage_summary(usage: Any, started: float) -> dict[str, Any]:
    input_tokens = int(getattr(usage, "input_tokens", 0) or 0)
    output_tokens = int(getattr(usage, "output_tokens", 0) or 0)
    cache_read = int(getattr(usage, "cache_read_input_tokens", 0) or 0)
    cache_write = int(getattr(usage, "cache_creation_input_tokens", 0) or 0)
    cost = cost_usd(input_tokens, output_tokens, cache_read, cache_write)
    ledger.record(cost)
    return {
        "model": settings.model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cache_read_tokens": cache_read,
        "cache_write_tokens": cache_write,
        "cost_usd": round(cost, 6),
        "latency_ms": int((time.perf_counter() - started) * 1000),
    }


REFUSAL_TEXT = (
    "I can't help with that one. I'm happy to talk about your project, Abdulla's work, "
    "or how technology could help your business."
)


async def stream_chat(messages: list[dict[str, str]]) -> AsyncIterator[dict[str, Any]]:
    """Yield {'type': 'text'|'done'|'error', ...} events for one assistant reply."""
    started = time.perf_counter()
    sent_text = False
    try:
        async with client().messages.stream(
            model=settings.model,
            max_tokens=settings.chat_max_tokens,
            # Haiku 5.5 thinks adaptively by default; low effort keeps simple answers fast and cheap.
            output_config={"effort": "low"},
            system=_cached_system(ASSISTANT_INSTRUCTIONS),
            messages=messages,  # type: ignore[arg-type]
        ) as stream:
            async for text in stream.text_stream:
                sent_text = True
                yield {"type": "text", "text": text}
            final = await stream.get_final_message()

        if final.stop_reason == "refusal":
            yield {"type": "text", "text": ("\n\n" if sent_text else "") + REFUSAL_TEXT}
        elif final.stop_reason == "max_tokens" and not sent_text:
            yield {"type": "text", "text": "Sorry, that one ran long. Could you ask it a shorter way?"}
        yield {"type": "done", "usage": _usage_summary(final.usage, started)}

    except anthropic.RateLimitError:
        yield {"type": "error", "message": "The AI is busy right now. Please try again in a minute."}
    except anthropic.AuthenticationError:
        yield {"type": "error", "message": "The AI demo isn't configured yet."}
    except anthropic.APIStatusError as e:
        msg = "The AI had a hiccup. Please try again." if e.status_code >= 500 else "That request couldn't be processed."
        yield {"type": "error", "message": msg}
    except anthropic.APIConnectionError:
        yield {"type": "error", "message": "Couldn't reach the AI service. Please try again."}


Service = Literal[
    "Market Intelligence & Research",
    "Graphic Design",
    "Data Analysis",
    "Web & SaaS Development",
]


class ProjectBrief(BaseModel):
    """A 5 Ws project brief produced from a visitor's description."""

    title: str = Field(description="Short project title, at most 8 words")
    summary: str = Field(description="Two-sentence plain summary of the problem and the goal")
    who: str = Field(description="Who it is for and who the problem affects")
    what: str = Field(description="What exactly the problem is and what success looks like")
    when: str = Field(description="When it happens and any timing or deadline, or what to clarify")
    where: str = Field(description="Where it shows up: online, in the data, or on the ground")
    why: str = Field(description="The likely root cause, not just the symptom")
    recommended_services: list[Service] = Field(description="Only the services that genuinely fit")
    relevant_experience: str = Field(
        description="One sentence on related past work by Abdulla, or an empty string if none is relevant"
    )
    questions_to_clarify: list[str] = Field(description="Up to 3 short questions to ask the visitor")
    next_step: str = Field(description="One concrete suggested next step")


class ScopeResult(BaseModel):
    brief: ProjectBrief | None
    message: str | None
    usage: dict[str, Any] | None


async def scope_project(problem: str) -> ScopeResult:
    started = time.perf_counter()
    try:
        response = await client().messages.parse(
            model=settings.model,
            max_tokens=settings.scope_max_tokens,
            output_config={"effort": "low"},
            system=_cached_system(SCOPER_INSTRUCTIONS),
            messages=[{"role": "user", "content": problem}],
            output_format=ProjectBrief,
        )
    except anthropic.RateLimitError:
        return ScopeResult(brief=None, message="The AI is busy right now. Please try again in a minute.", usage=None)
    except anthropic.AuthenticationError:
        return ScopeResult(brief=None, message="The AI demo isn't configured yet.", usage=None)
    except anthropic.APIStatusError:
        return ScopeResult(brief=None, message="The AI had a hiccup. Please try again.", usage=None)
    except anthropic.APIConnectionError:
        return ScopeResult(brief=None, message="Couldn't reach the AI service. Please try again.", usage=None)

    usage = _usage_summary(response.usage, started)
    if response.stop_reason == "refusal":
        return ScopeResult(brief=None, message=REFUSAL_TEXT, usage=usage)
    if response.parsed_output is None:
        return ScopeResult(brief=None, message="Couldn't build a brief from that. Try describing it differently.", usage=usage)
    return ScopeResult(brief=response.parsed_output, message=None, usage=usage)
