"""Meta Model API (Muse) client: OpenAI-compatible chat completions over HTTPS.

Used as Octo's fallback when Claude is unavailable, and by scripts/compare_models.py for
head-to-head evaluation. Muse spend is tracked in its own ledger with its own caps, so the
Meta credits can never be drained by site traffic.

Docs: https://dev.meta.ai/docs/protocols/chat-completions
"""

from __future__ import annotations

import json
import os
import time
from collections.abc import AsyncIterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

from app.ai.limits import SpendLedger, _env_float, _env_int

load_dotenv()


@dataclass(frozen=True)
class MuseSettings:
    base_url: str = os.getenv("MUSE_BASE_URL", "https://api.meta.ai/v1").rstrip("/")
    # Model IDs from the Meta Model API docs; confirm against your dashboard
    model: str = os.getenv("MUSE_MODEL", "muse-spark-1.3")
    # USD per million tokens. Defaults are published third-party figures for Spark;
    # set the exact prices from your Meta dashboard.
    price_input: float = _env_float("MUSE_PRICE_INPUT_PER_MTOK", 1.25)
    price_output: float = _env_float("MUSE_PRICE_OUTPUT_PER_MTOK", 4.25)
    price_cached: float = _env_float("MUSE_PRICE_CACHED_PER_MTOK", 0.125)
    # Separate, conservative caps on the Meta credits
    total_budget_usd: float = _env_float("MUSE_TOTAL_BUDGET_USD", 100.0)
    daily_budget_usd: float = _env_float("MUSE_DAILY_BUDGET_USD", 5.0)
    # Muse always reasons before answering, and reasoning tokens count toward max_tokens
    # (and are billed as output). Minimal effort keeps the fallback fast and cheap.
    reasoning_effort: str = os.getenv("MUSE_REASONING_EFFORT", "minimal")
    chat_max_tokens: int = _env_int("MUSE_CHAT_MAX_TOKENS", 3000)
    ledger_path: Path = Path(os.getenv("MUSE_LEDGER_PATH", "muse_usage.json"))

    @property
    def api_key(self) -> str:
        return os.getenv("META_API_KEY") or os.getenv("MODEL_API_KEY") or ""

    @property
    def has_key(self) -> bool:
        return bool(self.api_key)


muse_settings = MuseSettings()


class _MuseLedger(SpendLedger):
    """Same on-disk ledger as Claude's, checked against the Muse budgets."""

    def budget_error(self) -> str | None:
        with self._lock:
            if float(self._data.get("total_usd", 0.0)) >= muse_settings.total_budget_usd:
                return "Muse budget used up."
            if self._today() >= muse_settings.daily_budget_usd:
                return "Muse daily budget reached."
            return None


muse_ledger = _MuseLedger(muse_settings.ledger_path)


# Prices for models other than the configured default (used by the comparison script)
PRICES: dict[str, tuple[float, float, float]] = {
    # model: (input, output, cached input) USD per million tokens
    "muse-wonder-1.0": (4.0, 20.0, 0.20),
}


def muse_cost(model: str, prompt_tokens: int, completion_tokens: int, cached_tokens: int) -> float:
    p_in, p_out, p_cached = PRICES.get(model, (muse_settings.price_input, muse_settings.price_output, muse_settings.price_cached))
    uncached = max(0, prompt_tokens - cached_tokens)
    return (uncached * p_in + cached_tokens * p_cached + completion_tokens * p_out) / 1_000_000


class MuseError(Exception):
    def __init__(self, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.status = status


async def stream_muse(
    system: str,
    messages: list[dict[str, str]],
    model: str | None = None,
    max_tokens: int | None = None,
    record: bool = True,
    effort: str | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Yield {'type': 'text', 'text'} chunks, then one {'type': 'done', 'usage'} event.

    Raises MuseError on configuration, budget, HTTP or protocol failures.
    """
    if not muse_settings.has_key:
        raise MuseError("Muse is not configured (META_API_KEY missing).")
    if record and (err := muse_ledger.budget_error()):
        raise MuseError(err)

    model = model or muse_settings.model
    started = time.perf_counter()
    first_token_ms: int | None = None
    text_chars = 0
    usage: dict[str, Any] = {}
    payload = {
        "model": model,
        "stream": True,
        "stream_options": {"include_usage": True},
        "max_tokens": max_tokens or muse_settings.chat_max_tokens,
        "reasoning_effort": effort or muse_settings.reasoning_effort,
        "messages": [{"role": "system", "content": system}, *messages],
    }
    headers = {"Authorization": f"Bearer {muse_settings.api_key}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as http:
        async with http.stream("POST", f"{muse_settings.base_url}/chat/completions", json=payload, headers=headers) as res:
            if res.status_code != 200:
                body = (await res.aread()).decode("utf-8", "replace")[:300]
                raise MuseError(f"Muse HTTP {res.status_code}: {body}", res.status_code)
            async for line in res.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                try:
                    event = json.loads(data)
                except ValueError:
                    continue
                if event.get("usage"):
                    usage = event["usage"]
                for choice in event.get("choices") or []:
                    piece = (choice.get("delta") or {}).get("content")
                    if piece:
                        if first_token_ms is None:
                            first_token_ms = int((time.perf_counter() - started) * 1000)
                        text_chars += len(piece)
                        yield {"type": "text", "text": piece}

    prompt_tokens = int(usage.get("prompt_tokens") or 0)
    completion_tokens = int(usage.get("completion_tokens") or 0)
    cached = int(((usage.get("prompt_tokens_details") or {}).get("cached_tokens")) or 0)
    reasoning = int(((usage.get("completion_tokens_details") or {}).get("reasoning_tokens")) or 0)
    estimated = not usage
    if estimated:
        # The stream did not report usage: estimate at ~4 characters per token
        prompt_tokens = (len(system) + sum(len(m["content"]) for m in messages)) // 4
        completion_tokens = text_chars // 4
    cost = muse_cost(model, prompt_tokens, completion_tokens, cached)
    if record:
        muse_ledger.record(cost)
    yield {
        "type": "done",
        "usage": {
            "model": model,
            "input_tokens": prompt_tokens,
            "output_tokens": completion_tokens,
            "cache_read_tokens": cached,
            "cache_write_tokens": 0,
            "cost_usd": round(cost, 6),
            "latency_ms": int((time.perf_counter() - started) * 1000),
            "first_token_ms": first_token_ms,
            "reasoning_tokens": reasoning,
            "usage_estimated": estimated,
        },
    }
