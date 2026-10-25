import httpx
from fastapi.testclient import TestClient

from src.adapters.gemini import GeminiProvider
from src.interfaces.api import create_app


def test_live_launch_requires_ack_and_bounds(tmp_path):
    with TestClient(create_app(tmp_path, delay=0)) as client:
        assert (
            client.post(
                "/api/experiments", json={"definition": "india-skincare", "repeats": 3}
            ).status_code
            == 422
        )
        assert (
            client.post(
                "/api/experiments",
                json={"definition": "india-skincare", "repeats": 4, "free_tier_ack": True},
            ).status_code
            == 422
        )
        assert (
            client.post(
                "/api/experiments",
                json={
                    "definition": "india-skincare",
                    "repeats": 3,
                    "free_tier_ack": True,
                    "simulate_failure": True,
                },
            ).status_code
            == 422
        )


def test_live_api_exports_actual_mode(tmp_path):
    provider = GeminiProvider(
        "fake",
        httpx.MockTransport(lambda r: httpx.Response(429, json={"error": {"message": "quota"}})),
    )
    with TestClient(create_app(tmp_path, delay=0, live_provider=provider)) as client:
        response = client.post(
            "/api/experiments",
            json={"definition": "india-skincare", "repeats": 3, "free_tier_ack": True},
        )
        assert response.status_code == 201
        identifier = response.json()["id"]
        export = client.get(f"/api/experiments/{identifier}/export").json()
        assert export["status"]["mode"] == "live-ungrounded"
        assert export["status"]["unattempted"] == 17
        assert "Synthetic fixtures" not in export["notice"]


def test_unresolved_eligibility_blocks_real_launch(tmp_path):
    provider = GeminiProvider("fake", httpx.MockTransport(lambda r: httpx.Response(429, json={})))
    with TestClient(
        create_app(
            tmp_path, delay=0, live_provider=provider, eligibility_hold="Eligibility pending"
        )
    ) as client:
        before = len(client.get("/api/experiments").json())
        response = client.post(
            "/api/experiments",
            json={"definition": "india-skincare", "repeats": 3, "free_tier_ack": True},
        )
        assert response.status_code == 409
        assert "eligibility" in response.json()["detail"].lower()
        assert len(client.get("/api/experiments").json()) == before
