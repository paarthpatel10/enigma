import asyncio
import hashlib
import json
import logging
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from src.adapters.replay import replay
from src.adapters.store import FileStore
from src.domain.research import ExperimentDefinition

logger = logging.getLogger("enigma.runs")


def now() -> str:
    return datetime.now(UTC).isoformat()


def prepare(
    store: FileStore, definition: ExperimentDefinition, name: str, simulate_failure: bool = False
) -> dict[str, Any]:
    identifier = uuid4().hex
    snapshot = {
        **definition.snapshot(),
        "experiment_id": identifier,
        "created_at": now(),
        "simulate_failure": simulate_failure,
    }
    store.create(identifier, snapshot)
    status = {
        "id": identifier,
        "name": name,
        "created_at": snapshot["created_at"],
        "status": "queued",
        "completed": 0,
        "failed": 0,
        "total": len(definition.prompts) * len(definition.models) * definition.repeats,
        "category": definition.category,
        "mode": "synthetic-replay",
    }
    store.status(identifier, status)
    return status


async def collect(
    store: FileStore, identifier: str, definition: ExperimentDefinition, delay: float = 0.04
) -> None:
    status = store.read(identifier)
    manifest = store.read(identifier, "manifest")
    config_hash = hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()
    status["status"] = "running"
    store.status(identifier, status)
    try:
        for prompt_index, prompt in enumerate(definition.prompts):
            for model in definition.models:
                for repeat in range(definition.repeats):
                    response = replay(
                        definition, model, prompt_index, repeat, manifest["simulate_failure"]
                    )
                    run = {
                        "id": f"run-{status['completed'] + 1:04d}",
                        "experiment_id": identifier,
                        "model": model,
                        "provider": "Enigma synthetic fixtures",
                        "timestamp": now(),
                        "prompt": prompt,
                        "prompt_variant": f"variant-{prompt_index + 1}",
                        "prompt_family": "project-tool-selection",
                        "run_number": repeat + 1,
                        "persona": definition.persona,
                        "geography": definition.geography,
                        "surface": "synthetic-replay",
                        "synthetic": True,
                        "settings": {"seed": 42},
                        "schema_version": "1.0",
                        "manifest_sha256": config_hash,
                        **response,
                    }
                    store.append(identifier, run)
                    status["completed"] += 1
                    status["failed"] += int(response["status"] == "failed")
                    store.status(identifier, status)
                    logger.info(
                        json.dumps(
                            {
                                "event": "run_saved",
                                "experiment_id": identifier,
                                "run_id": run["id"],
                                "outcome": run["status"],
                            }
                        )
                    )
                    if delay:
                        await asyncio.sleep(delay)
        status["status"] = "completed_with_errors" if status["failed"] else "completed"
    except (Exception, asyncio.CancelledError):
        status["status"] = "interrupted"
        logger.exception("experiment_interrupted experiment_id=%s", identifier)
    finally:
        store.status(identifier, status)
