"""Octo speaks in Abdulla's cloned voice via ElevenLabs text-to-speech.

The ElevenLabs key and voice ID stay on the server (backend/.env). Speech is billed per
character, so every request is capped by length, per visitor per day, and for the whole
site per day. With no key/voice configured the feature is simply off (Octo stays silent).
"""

from __future__ import annotations

import json
import os
import threading
from collections import defaultdict
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class VoiceSettings:
    model: str = os.getenv("ELEVENLABS_MODEL", "eleven_v4_turbo")  # low latency, supports cloned voices
    output_format: str = os.getenv("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_64")
    max_chars_per_request: int = _int("VOICE_MAX_CHARS_PER_REQUEST", 400)
    per_ip_daily_chars: int = _int("VOICE_PER_IP_DAILY_CHARS", 4000)
    site_daily_chars: int = _int("VOICE_SITE_DAILY_CHARS", 30000)
    ledger_path: Path = Path(os.getenv("VOICE_LEDGER_PATH", "voice_usage.json"))

    @property
    def api_key(self) -> str:
        return os.getenv("ELEVENLABS_API_KEY", "")

    @property
    def voice_id(self) -> str:
        return os.getenv("ELEVENLABS_VOICE_ID", "")

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.voice_id)


voice_settings = VoiceSettings()


class CharLedger:
    """Daily character counts for the site (persisted) and per visitor (in memory)."""

    def __init__(self, path: Path) -> None:
        self._path = path
        self._lock = threading.Lock()
        self._per_ip: dict[tuple[str, str], int] = defaultdict(int)
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            self._days: dict[str, int] = raw if isinstance(raw, dict) else {}
        except (OSError, ValueError):
            self._days = {}

    def reserve(self, ip: str, chars: int) -> str | None:
        """Reserve characters for one request, or return a reason it isn't allowed."""
        today = date.today().isoformat()
        with self._lock:
            if self._days.get(today, 0) + chars > voice_settings.site_daily_chars:
                return "Octo's voice is resting for today."
            if self._per_ip[(ip, today)] + chars > voice_settings.per_ip_daily_chars:
                return "You've reached today's voice limit. Octo will keep answering in text."
            self._days[today] = self._days.get(today, 0) + chars
            self._per_ip[(ip, today)] += chars
            tmp = self._path.with_suffix(".tmp")
            tmp.write_text(json.dumps(self._days, indent=2, sort_keys=True), encoding="utf-8")
            tmp.replace(self._path)
            return None


char_ledger = CharLedger(voice_settings.ledger_path)


class SpeechError(Exception):
    """ElevenLabs refused or failed the request (bad key/voice, quota, outage)."""


async def open_speech(text: str) -> AsyncIterator[bytes]:
    """Start a speech request and confirm it succeeded *before* any audio is sent to the browser.

    Returns an async iterator of MP3 chunks; raises SpeechError if ElevenLabs rejects the request.
    """
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_settings.voice_id}/stream"
    body = {
        "text": text,
        "model_id": voice_settings.model,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.85, "style": 0, "use_speaker_boost": True},
    }
    headers = {"xi-api-key": voice_settings.api_key, "Content-Type": "application/json", "Accept": "audio/mpeg"}
    client = httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0))
    try:
        request = client.build_request(
            "POST", url, params={"output_format": voice_settings.output_format}, json=body, headers=headers
        )
        resp = await client.send(request, stream=True)
    except httpx.HTTPError as e:
        await client.aclose()
        raise SpeechError(f"Couldn't reach ElevenLabs: {e.__class__.__name__}") from e

    if resp.status_code != 200:
        detail = (await resp.aread())[:300].decode(errors="replace")
        await resp.aclose()
        await client.aclose()
        raise SpeechError(f"ElevenLabs returned {resp.status_code}: {detail}")

    async def chunks() -> AsyncIterator[bytes]:
        try:
            async for chunk in resp.aiter_bytes():
                yield chunk
        finally:
            await resp.aclose()
            await client.aclose()

    return chunks()
