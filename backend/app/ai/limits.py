"""Settings, per-visitor rate limits and the spend ledger that protect the AI budget.

Two layers keep spend bounded:
  1. A hard spend limit on the Anthropic Console workspace (set by the site owner) - the real backstop.
  2. This module: per-IP message limits and a local spend ledger that stops serving once the
     daily or total budget is reached, so visitors see a friendly message instead of errors.
"""

from __future__ import annotations

import json
import os
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, default))
    except ValueError:
        return default


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class AISettings:
    model: str = os.getenv("AI_MODEL", "claude-haiku-5-5")
    # Claude Haiku 5.5 list prices (USD per million tokens, prompts up to 100K tokens)
    price_input: float = _env_float("AI_PRICE_INPUT_PER_MTOK", 0.10)
    price_output: float = _env_float("AI_PRICE_OUTPUT_PER_MTOK", 0.50)
    price_cache_read: float = _env_float("AI_PRICE_CACHE_READ_PER_MTOK", 0.01)
    price_cache_write: float = _env_float("AI_PRICE_CACHE_WRITE_PER_MTOK", 0.125)
    # Budgets, kept a little under the Console limit so the ledger trips first
    total_budget_usd: float = _env_float("AI_TOTAL_BUDGET_USD", 4.50)
    daily_budget_usd: float = _env_float("AI_DAILY_BUDGET_USD", 0.50)
    # Per-visitor limits
    per_ip_hourly: int = _env_int("AI_PER_IP_HOURLY", 20)
    per_ip_daily: int = _env_int("AI_PER_IP_DAILY", 60)
    # Input limits
    max_message_chars: int = _env_int("AI_MAX_MESSAGE_CHARS", 800)
    max_history_messages: int = _env_int("AI_MAX_HISTORY_MESSAGES", 12)
    max_problem_chars: int = _env_int("AI_MAX_PROBLEM_CHARS", 2000)
    # Output limits (thinking counts toward max_tokens on Haiku 5.5, so leave headroom)
    chat_max_tokens: int = _env_int("AI_CHAT_MAX_TOKENS", 1200)
    scope_max_tokens: int = _env_int("AI_SCOPE_MAX_TOKENS", 2500)
    trust_proxy: bool = os.getenv("AI_TRUST_PROXY", "false").lower() == "true"
    ledger_path: Path = Path(os.getenv("AI_LEDGER_PATH", "ai_usage.json"))

    @property
    def has_key(self) -> bool:
        return bool(os.getenv("ANTHROPIC_API_KEY"))


settings = AISettings()


def cost_usd(input_tokens: int, output_tokens: int, cache_read: int, cache_write: int) -> float:
    """Price one response from its usage numbers."""
    return (
        input_tokens * settings.price_input
        + output_tokens * settings.price_output
        + cache_read * settings.price_cache_read
        + cache_write * settings.price_cache_write
    ) / 1_000_000


class RateLimiter:
    """Sliding-window message limits per visitor IP (in memory; resets on restart)."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check_and_record(self, ip: str) -> str | None:
        """Return an error message if the visitor is over a limit, else record the hit."""
        now = time.time()
        with self._lock:
            hits = self._hits[ip]
            while hits and now - hits[0] > 86_400:
                hits.popleft()
            last_hour = sum(1 for t in hits if now - t <= 3_600)
            if last_hour >= settings.per_ip_hourly:
                return "You've reached the hourly message limit for this demo. Please try again a bit later."
            if len(hits) >= settings.per_ip_daily:
                return "You've reached today's message limit for this demo. Please come back tomorrow."
            hits.append(now)
            return None


class SpendLedger:
    """Tracks estimated spend on disk so the budget survives restarts."""

    def __init__(self, path: Path) -> None:
        self._path = path
        self._lock = threading.Lock()
        self._data = self._load()

    def _load(self) -> dict[str, object]:
        try:
            raw = json.loads(self._path.read_text(encoding="utf-8"))
            if isinstance(raw, dict):
                return raw
        except (OSError, ValueError):
            pass
        return {"total_usd": 0.0, "days": {}, "requests": 0}

    def _save(self) -> None:
        tmp = self._path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self._data, indent=2, sort_keys=True), encoding="utf-8")
        tmp.replace(self._path)

    def _today(self) -> float:
        days = self._data.get("days", {})
        return float(days.get(date.today().isoformat(), 0.0)) if isinstance(days, dict) else 0.0

    def budget_error(self) -> str | None:
        """Return a visitor-facing message if the budget is used up, else None."""
        with self._lock:
            if float(self._data.get("total_usd", 0.0)) >= settings.total_budget_usd:
                return "The AI demo has used its budget and is resting for now. Please reach out via /contact."
            if self._today() >= settings.daily_budget_usd:
                return "The AI demo has reached today's budget. Please come back tomorrow, or use /contact."
            return None

    def record(self, amount_usd: float) -> None:
        with self._lock:
            self._data["total_usd"] = round(float(self._data.get("total_usd", 0.0)) + amount_usd, 6)
            days = self._data.setdefault("days", {})
            if isinstance(days, dict):
                key = date.today().isoformat()
                days[key] = round(float(days.get(key, 0.0)) + amount_usd, 6)
            self._data["requests"] = int(self._data.get("requests", 0)) + 1
            self._save()

    def snapshot(self) -> dict[str, float]:
        with self._lock:
            return {
                "total_usd": round(float(self._data.get("total_usd", 0.0)), 4),
                "today_usd": round(self._today(), 4),
                "total_budget_usd": settings.total_budget_usd,
            }


rate_limiter = RateLimiter()
ledger = SpendLedger(settings.ledger_path)
