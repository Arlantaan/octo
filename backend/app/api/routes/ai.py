"""AI endpoints: assistant chat (streamed as server-sent events), the 5 Ws Project Scoper, and status."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.ai.limits import ledger, rate_limiter, settings
from app.ai.service import ScopeResult, scope_project, stream_chat

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)


class ScopeRequest(BaseModel):
    problem: str = Field(min_length=10)


def _client_ip(request: Request) -> str:
    if settings.trust_proxy:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _guard(request: Request) -> None:
    """Refuse before any tokens are spent: not configured, over budget, or over the visitor's limit."""
    if not settings.has_key:
        raise HTTPException(status_code=503, detail="The AI demo isn't configured yet.")
    budget = ledger.budget_error()
    if budget:
        raise HTTPException(status_code=503, detail=budget)
    limited = rate_limiter.check_and_record(_client_ip(request))
    if limited:
        raise HTTPException(status_code=429, detail=limited)


def _clean_history(messages: list[ChatMessage]) -> list[dict[str, str]]:
    """Keep the most recent turns, enforce size limits, and make sure the conversation is well formed."""
    recent = messages[-settings.max_history_messages:]
    cleaned: list[dict[str, str]] = []
    for m in recent:
        text = m.content.strip()
        if m.role == "user" and len(text) > settings.max_message_chars:
            raise HTTPException(
                status_code=400,
                detail=f"Please keep messages under {settings.max_message_chars} characters.",
            )
        text = text[: settings.max_message_chars * 3]  # assistant turns come from us, but cap them anyway
        if cleaned and cleaned[-1]["role"] == m.role:
            cleaned[-1]["content"] += "\n\n" + text  # merge accidental same-role repeats
        else:
            cleaned.append({"role": m.role, "content": text})
    while cleaned and cleaned[0]["role"] != "user":
        cleaned.pop(0)
    if not cleaned or cleaned[-1]["role"] != "user":
        raise HTTPException(status_code=400, detail="The last message must come from the visitor.")
    return cleaned


@router.get("/status")
async def status() -> dict[str, Any]:
    """Whether the demo is available, without revealing anything sensitive."""
    reason = None if settings.has_key else "not_configured"
    reason = reason or ("budget" if ledger.budget_error() else None)
    return {"available": reason is None, "reason": reason, "model": settings.model}


@router.post("/chat")
async def chat(body: ChatRequest, request: Request) -> StreamingResponse:
    history = _clean_history(body.messages)
    _guard(request)

    async def events() -> AsyncIterator[str]:
        async for event in stream_chat(history):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},  # no proxy buffering
    )


@router.post("/scope", response_model=ScopeResult)
async def scope(body: ScopeRequest, request: Request) -> ScopeResult:
    problem = body.problem.strip()
    if len(problem) > settings.max_problem_chars:
        raise HTTPException(
            status_code=400,
            detail=f"Please keep the description under {settings.max_problem_chars} characters.",
        )
    _guard(request)
    return await scope_project(problem)
