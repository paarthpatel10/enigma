from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.adapters.store import FileStore
from src.interfaces.api import create_app


def test_raw_evidence_cannot_be_overwritten(tmp_path: Path):
    store = FileStore(tmp_path)
    store.create("test", {"version": "1"})
    store.append("test", {"id": "run-1", "raw_text": "original"})
    with pytest.raises(FileExistsError):
        store.append("test", {"id": "run-1", "raw_text": "changed"})
    assert store.runs("test")[0]["raw_text"] == "original"


def test_reviewer_flow_and_unknown_definition(tmp_path: Path):
    with TestClient(create_app(tmp_path, delay=0)) as client:
        experiments = client.get("/api/experiments").json()
        assert experiments[0]["completed"] == 120
        created = client.post(
            "/api/experiments", json={"name": "Review test", "repeats": 1, "simulate_failure": True}
        )
        assert created.status_code == 201
        experiment_id = created.json()["id"]
        result = client.get(f"/api/experiments/{experiment_id}").json()
        assert result["status"] == "completed_with_errors"
        assert result["summary"]["successful"] == 11
        assert result["summary"]["failed"] == 1
        bundle = client.get(f"/api/experiments/{experiment_id}/export").json()
        assert len(bundle["runs"]) == 12
        assert bundle["manifest"]["surface"] == "synthetic-replay"
        assert client.post("/api/experiments", json={"definition": "../../evil"}).status_code == 422
        assert client.get("/api/experiments/missing").status_code == 404
        assert client.post("/api/experiments", json={"repeats": 999}).status_code == 422


def test_restart_preserves_evidence_and_marks_unfinished_job(tmp_path: Path):
    with TestClient(create_app(tmp_path, delay=0)) as client:
        initial = client.get("/api/experiments").json()[0]
        identifier = initial["id"]
        original = client.get(f"/api/experiments/{identifier}/export").json()["runs"]
    store = FileStore(tmp_path)
    store.status(identifier, {**initial, "status": "running"})
    with TestClient(create_app(tmp_path, delay=0)) as client:
        result = client.get(f"/api/experiments/{identifier}/export").json()
        assert result["runs"] == original
        assert result["status"]["status"] == "interrupted"


def test_cross_origin_write_is_rejected(tmp_path: Path):
    with TestClient(create_app(tmp_path, delay=0)) as client:
        response = client.post(
            "/api/experiments", json={}, headers={"Origin": "https://example.com"}
        )
        assert response.status_code == 403
