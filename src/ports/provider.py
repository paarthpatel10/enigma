from typing import Any, Protocol


class Provider(Protocol):
    async def collect(self, prompt: str) -> dict[str, Any]: ...
