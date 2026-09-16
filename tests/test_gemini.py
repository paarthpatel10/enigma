import asyncio
import json

import httpx
import pytest

from src.adapters.gemini import GeminiProvider, load_key


def test_key_precedence_and_missing(tmp_path, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    path = tmp_path / ".env"
    path.write_text("gemini=legacy\nGEMINI_API_KEY='canonical'\n")
    assert load_key(path) == "canonical"
    monkeypatch.setenv("GEMINI_API_KEY", "process")
    assert load_key(path) == "process"
    monkeypatch.delenv("GEMINI_API_KEY")
    path.write_text("# no key\n")
    with pytest.raises(ValueError, match="GEMINI_API_KEY"):
        load_key(path)


@pytest.mark.parametrize(
    "finish,text,outcome",
    [
        ("STOP", "1. Simple Rich Moisturiser", "succeeded"),
        ("STOP", "", "excluded"),
        ("MAX_TOKENS", "Partial", "excluded"),
        ("SAFETY", "", "excluded"),
    ],
)
def test_response_classification_and_preservation(finish, text, outcome):
    payload = {
        "candidates": [{"content": {"parts": [{"text": text}]}, "finishReason": finish}],
        "modelVersion": "gemini-3.1-flash-lite",
        "usageMetadata": {"totalTokenCount": 19},
    }

    def handler(request):
        assert request.headers["x-goog-api-key"] == "test-secret"
        body = json.loads(request.content)
        assert "tools" not in body
        assert body["generationConfig"]["maxOutputTokens"] == 1024
        return httpx.Response(200, json=payload)

    result = asyncio.run(
        GeminiProvider("test-secret", httpx.MockTransport(handler)).collect("Question")
    )
    assert result["status"] == outcome
    assert result["raw_provider_response"] == payload
    assert result["raw_text"] == text
    assert result["usage"] == {"totalTokenCount": 19}
    assert not result["stop_collection"]


@pytest.mark.parametrize("code", [401, 403, 404, 429, 500])
def test_http_error_stops_without_retry_and_redacts(code):
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(code, json={"error": {"message": "bad test-secret"}})

    result = asyncio.run(
        GeminiProvider("test-secret", httpx.MockTransport(handler)).collect("Question")
    )
    assert len(calls) == 1
    assert result["stop_collection"]
    assert result["status"] == "failed"
    assert result["http_status"] == code
    assert "test-secret" not in json.dumps(result)


def test_transport_timeout_stops_without_leaking():
    def handler(request):
        raise httpx.ReadTimeout("test-secret", request=request)

    result = asyncio.run(
        GeminiProvider("test-secret", httpx.MockTransport(handler)).collect("Question")
    )
    assert result["error"] == "transport_error"
    assert result["stop_collection"]
    assert "test-secret" not in json.dumps(result)


def test_malformed_success_is_protocol_failure():
    provider = GeminiProvider(
        "fake", httpx.MockTransport(lambda r: httpx.Response(200, text="not json"))
    )
    result = asyncio.run(provider.collect("Question"))
    assert result["stop_collection"]
    assert result["error"] == "invalid_response"


def test_prompt_block_is_preserved():
    payload = {"promptFeedback": {"blockReason": "SAFETY"}}
    provider = GeminiProvider(
        "fake", httpx.MockTransport(lambda r: httpx.Response(200, json=payload))
    )
    result = asyncio.run(provider.collect("Question"))
    assert result["status"] == "excluded"
    assert result["raw_provider_response"] == payload
