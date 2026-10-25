"""Bounded ungrounded collection. Never log credentials or request headers."""

import json
import os
import re
import ssl
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

MODEL = "gemini-3.1-flash-lite"
SETTINGS = {"temperature": 1, "maxOutputTokens": 1024}


def load_key(path: Path = Path(".env")) -> str:
    values = {}
    if path.exists():
        for line in path.read_text(encoding="utf-8-sig").splitlines():
            match = re.match(r"^\s*(?:export\s+)?(GEMINI_API_KEY|gemini)\s*=\s*(.*?)\s*$", line)
            if match:
                values[match[1]] = match[2].strip("\"'")
    key = os.environ.get("GEMINI_API_KEY") or values.get("GEMINI_API_KEY") or values.get("gemini")
    if not key or not key.strip():
        raise ValueError("Set GEMINI_API_KEY in the process environment or local .env")
    return key.strip()


class GeminiProvider:
    def __init__(self, key: str, transport: httpx.AsyncBaseTransport | None = None):
        self._key = key
        self._transport = transport

    async def collect(self, prompt: str) -> dict[str, Any]:
        started = datetime.now(UTC).isoformat()
        clock = time.monotonic()
        result: dict[str, Any] = {
            "status": "failed",
            "raw_text": "",
            "error": None,
            "exclusion_reason": None,
            "stop_collection": True,
            "http_status": None,
            "raw_provider_response": None,
            "started_at": started,
            "usage": {},
            "grounding_state": "disabled",
        }
        try:
            async with httpx.AsyncClient(
                transport=self._transport, timeout=60, verify=ssl.create_default_context()
            ) as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                    headers={"x-goog-api-key": self._key},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": SETTINGS,
                    },
                )
            result["http_status"] = response.status_code
            safe_body = response.text.replace(self._key, "[REDACTED]")
            try:
                payload = json.loads(safe_body)
            except ValueError:
                payload = {"unparsed_body": safe_body}
            result["raw_provider_response"] = payload
            if response.status_code != 200:
                result["error"] = f"http_{response.status_code}"
            elif not isinstance(payload, dict) or not (
                "candidates" in payload or "promptFeedback" in payload
            ):
                result["error"] = "invalid_response"
            else:
                candidates = payload.get("candidates") or []
                candidate = candidates[0] if candidates else {}
                parts = candidate.get("content", {}).get("parts", [])
                text = "\n".join(p["text"] for p in parts if "text" in p and not p.get("thought"))
                finish = candidate.get("finishReason")
                eligible = finish == "STOP" and bool(text.strip())
                result.update(
                    raw_text=text,
                    status="succeeded" if eligible else "excluded",
                    error=None if eligible else "incomplete_or_blocked",
                    stop_collection=False,
                    finish_reason=finish,
                    model_version=payload.get("modelVersion"),
                    usage=payload.get("usageMetadata", {}),
                )
        except httpx.HTTPError:
            result["error"] = "transport_error"
        except (KeyError, TypeError, AttributeError):
            result["error"] = "invalid_response"
        if result["status"] != "succeeded":
            result["exclusion_reason"] = result["error"]
        result["ended_at"] = datetime.now(UTC).isoformat()
        result["elapsed_seconds"] = round(time.monotonic() - clock, 3)
        return result
