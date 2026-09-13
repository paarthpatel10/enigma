import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import replace
from pathlib import Path
from typing import Any, Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from experiments.project_tools import EXPERIMENT
from src.adapters.store import FileStore
from src.application.runner import collect, prepare
from src.domain.research import extract, summarize


class StartRequest(BaseModel):
    definition: Literal["project-tools"] = "project-tools"
    name: str = Field(default="Project management landscape", min_length=1, max_length=100)
    repeats: int = Field(default=10, ge=1, le=20)
    simulate_failure: bool = False


def create_app(root: Path | None = None, delay: float = 0.04) -> FastAPI:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    store = FileStore(root or Path(os.environ.get("ENIGMA_DATA_DIR", "data/raw")))

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        for status in store.list():
            if status["status"] in {"queued", "running"}:
                status["status"] = "interrupted"
                store.status(status["id"], status)
        if not store.list():
            initial = prepare(store, EXPERIMENT, "Project management landscape")
            await collect(store, initial["id"], EXPERIMENT, delay=0)
        yield

    app = FastAPI(title="Enigma reviewer prototype", lifespan=lifespan)

    @app.middleware("http")
    async def local_writes(request: Request, call_next: Any) -> Any:
        # Reject cross-site browser writes to this unauthenticated local-only service.
        origin = request.headers.get("origin")
        if (
            request.method not in {"GET", "HEAD", "OPTIONS"}
            and origin
            and origin
            not in {
                "http://127.0.0.1:8000",
                "http://localhost:8000",
                "http://127.0.0.1:5173",
                "http://localhost:5173",
            }
        ):
            return JSONResponse({"detail": "Cross-origin writes are disabled"}, status_code=403)
        return await call_next(request)

    def require(identifier: str) -> dict[str, Any]:
        try:
            return store.read(identifier)
        except (FileNotFoundError, ValueError) as exc:
            raise HTTPException(404, "Experiment not found") from exc

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "mode": "synthetic-replay"}

    @app.get("/api/experiments")
    def experiments() -> list[dict[str, Any]]:
        return store.list()

    @app.post("/api/experiments", status_code=201)
    def start(body: StartRequest, tasks: BackgroundTasks) -> dict[str, Any]:
        with store.lock:
            if any(s["status"] in {"queued", "running"} for s in store.list()):
                raise HTTPException(409, "A replay is already running. Wait for it to finish.")
            definition = replace(EXPERIMENT, repeats=body.repeats)
            status = prepare(
                store, definition, body.name.strip() or EXPERIMENT.name, body.simulate_failure
            )
        tasks.add_task(collect, store, status["id"], definition, delay)
        return status

    @app.get("/api/experiments/{identifier}")
    def detail(identifier: str) -> dict[str, Any]:
        status = require(identifier)
        manifest = store.read(identifier, "manifest")
        return {
            **status,
            "manifest": manifest,
            "summary": summarize(store.runs(identifier), manifest["brands"]),
        }

    @app.get("/api/experiments/{identifier}/responses")
    def responses(identifier: str) -> list[dict[str, Any]]:
        require(identifier)
        brands = store.read(identifier, "manifest")["brands"]
        return [{**run, **extract(run["raw_text"], brands)} for run in store.runs(identifier)]

    @app.get("/api/experiments/{identifier}/export")
    def export(identifier: str) -> JSONResponse:
        status = require(identifier)
        return JSONResponse(
            {
                "notice": "Synthetic fixtures; not empirical brand research.",
                "manifest": store.read(identifier, "manifest"),
                "status": status,
                "runs": store.runs(identifier),
                "report": detail(identifier)["summary"],
            },
            headers={"Content-Disposition": f'attachment; filename="enigma-{identifier}.json"'},
        )

    frontend = Path(__file__).resolve().parents[2] / "frontend" / "dist"
    if frontend.exists():
        app.mount("/", StaticFiles(directory=frontend, html=True), name="frontend")
    return app


app = create_app()
