import asyncio
import json

import httpx

from experiments.india_skincare import EXPERIMENT
from src.adapters.gemini import GeminiProvider
from src.adapters.store import FileStore
from src.application.runner import collect, prepare
from src.domain.research import extract_live, summarize


def test_ambiguous_words_are_not_brands():
    assert extract_live("A simple minimalist routine is useful.")["mentions"] == []
    assert extract_live("Simple Replenishing Rich Moisturiser and Minimalist Marula Oil")[
        "mentions"
    ] == ["Minimalist", "Simple"]
    assert extract_live("Dot and Key moisturizer")["mentions"] == ["Dot & Key"]


def test_live_stop_preserves_failure_and_unattempted(tmp_path):
    store = FileStore(tmp_path)
    status = prepare(store, EXPERIMENT, "Pilot")
    provider = GeminiProvider(
        "fake",
        httpx.MockTransport(lambda r: httpx.Response(429, json={"error": {"message": "quota"}})),
    )
    asyncio.run(collect(store, status["id"], EXPERIMENT, delay=0, provider=provider))
    saved = store.read(status["id"])
    assert saved["total"] == 18
    assert saved["completed"] == 1
    assert saved["unattempted"] == 17
    assert saved["status"] == "interrupted"
    raw = store.runs(status["id"])
    assert raw[0]["synthetic"] is False
    assert raw[0]["raw_provider_response"]["error"]["message"] == "quota"
    assert "fake" not in json.dumps(raw)


def test_live_summary_excludes_incomplete_and_suppresses_intervals():
    runs = [
        dict(
            status="succeeded",
            raw_text="Simple Rich Moisturiser",
            model="gemini",
            synthetic=False,
            prompt_variant="v1",
        ),
        dict(
            status="excluded",
            raw_text="Minimalist Marula",
            model="gemini",
            synthetic=False,
            prompt_variant="v1",
        ),
    ]
    summary = summarize(runs, EXPERIMENT.brands)
    assert summary["successful"] == 1
    assert summary["excluded"] == 1
    assert summary["failed"] == 0
    assert summary["brands"][1]["mentions"] == 1
    assert summary["brands"][0]["mentions"] == 0
    assert summary["brands"][1]["interval"] is None
    assert summary["brands"][1]["recommendations"] is None
