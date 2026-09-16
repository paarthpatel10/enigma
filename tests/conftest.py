"""Default tests must never contact providers, even when local credentials exist."""

import httpx
import pytest


@pytest.fixture(autouse=True)
def block_provider_network(monkeypatch):
    async def blocked(*args, **kwargs):
        raise AssertionError("Real HTTP transport is forbidden in offline tests")

    monkeypatch.setattr(httpx.AsyncHTTPTransport, "handle_async_request", blocked)
