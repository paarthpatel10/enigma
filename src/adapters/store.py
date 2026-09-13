"""Local append-only raw evidence, with atomic mutable progress metadata."""

import json
import re
from pathlib import Path
from threading import RLock
from typing import Any
from uuid import uuid4


class FileStore:
    def __init__(self, root: Path):
        self.root = root
        self.lock = RLock()
        root.mkdir(parents=True, exist_ok=True)

    def directory(self, experiment_id: str) -> Path:
        if not re.fullmatch(r"[a-zA-Z0-9-]{1,80}", experiment_id):
            raise ValueError("Invalid experiment ID")
        return self.root / experiment_id

    def create(self, experiment_id: str, manifest: dict[str, Any]) -> None:
        directory = self.directory(experiment_id)
        directory.mkdir()
        (directory / "raw").mkdir()
        with (directory / "manifest.json").open("x", encoding="utf-8") as handle:
            json.dump(manifest, handle, indent=2)

    def read(self, experiment_id: str, name: str = "status") -> dict[str, Any]:
        with (
            self.lock,
            (self.directory(experiment_id) / f"{name}.json").open(encoding="utf-8") as handle,
        ):
            result: dict[str, Any] = json.load(handle)
        return result

    def status(self, experiment_id: str, value: dict[str, Any]) -> None:
        target = self.directory(experiment_id) / "status.json"
        temporary = target.with_suffix(f".{uuid4().hex}.tmp")
        with self.lock:
            temporary.write_text(json.dumps(value, indent=2), encoding="utf-8")
            temporary.replace(target)

    def append(self, experiment_id: str, run: dict[str, Any]) -> None:
        target = self.directory(experiment_id) / "raw" / f"{run['id']}.json"
        with self.lock, target.open("x", encoding="utf-8") as handle:
            json.dump(run, handle, indent=2)

    def runs(self, experiment_id: str) -> list[dict[str, Any]]:
        with self.lock:
            return [
                json.loads(path.read_text(encoding="utf-8"))
                for path in sorted((self.directory(experiment_id) / "raw").glob("*.json"))
            ]

    def list(self) -> list[dict[str, Any]]:
        with self.lock:
            return sorted(
                [
                    json.loads(p.read_text(encoding="utf-8"))
                    for p in self.root.glob("*/status.json")
                ],
                key=lambda row: row["created_at"],
                reverse=True,
            )
