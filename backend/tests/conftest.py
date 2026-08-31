"""Test fixtures.

These tests run against a real PostgreSQL — the behaviours worth testing here
(RLS, the closure gate's PostGIS distance, the audit hash chain, enum casts)
are all database behaviour, and a mock would only prove the mock works.

The seed runs once per session and the suite is written to tolerate its own
mutations, so a re-run without re-seeding still passes.
"""

from __future__ import annotations

import asyncio
import os
import subprocess
import sys
import uuid
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import httpx
import pytest

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

# The app connects as strata_app (NOBYPASSRLS); the seed needs owner rights to
# write across tenants, so the two use different URLs by design.
APP_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "")
SEED_DATABASE_URL = os.environ.get("SEED_DATABASE_URL", "")

pytestmark = pytest.mark.skipif(
    not APP_DATABASE_URL, reason="TEST_DATABASE_URL is not set"
)


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line("markers", "contract: one test per endpoint card")


@pytest.fixture(scope="session")
def event_loop() -> Iterator[asyncio.AbstractEventLoop]:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def seeded() -> None:
    """Rebuild the demo dataset once, so ordering between tests cannot matter."""
    if not SEED_DATABASE_URL:
        pytest.skip("SEED_DATABASE_URL is not set")
    result = subprocess.run(  # noqa: S603
        [sys.executable, str(BACKEND / "scripts" / "seed_dev.py")],
        env={**os.environ, "DATABASE_URL": SEED_DATABASE_URL},
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        pytest.fail(f"seed failed:\n{result.stdout}\n{result.stderr}")


@pytest.fixture(scope="session")
def app():  # noqa: ANN201
    os.environ["DATABASE_URL"] = APP_DATABASE_URL
    os.environ.setdefault("AUTHZ_SKIP_GRAPH_CHECK", "true")
    os.environ.setdefault("ENVIRONMENT", "local")
    from app.main import create_app

    return create_app()


@pytest.fixture
async def anon(app) -> AsyncIterator[httpx.AsyncClient]:  # noqa: ANN001
    """A client with no session — for testing that endpoints require one."""
    transport = httpx.ASGITransport(app=app)
    async with app.router.lifespan_context(app):
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            yield c


async def _signed_in(app, email: str) -> httpx.AsyncClient:  # noqa: ANN001
    transport = httpx.ASGITransport(app=app)
    client = httpx.AsyncClient(transport=transport, base_url="http://test")
    response = await client.post(
        "/api/v1/auth/sessions",
        json={"method": "PASSWORD", "email": email, "password": "strata-demo"},
    )
    assert response.status_code == 201, response.text
    return client


@pytest.fixture
async def manager(app) -> AsyncIterator[httpx.AsyncClient]:  # noqa: ANN001
    async with app.router.lifespan_context(app):
        client = await _signed_in(app, "manager@strata.demo")
        yield client
        await client.aclose()


@pytest.fixture
async def safety_officer(app) -> AsyncIterator[httpx.AsyncClient]:  # noqa: ANN001
    async with app.router.lifespan_context(app):
        client = await _signed_in(app, "safety@strata.demo")
        yield client
        await client.aclose()


@pytest.fixture
async def ministry(app) -> AsyncIterator[httpx.AsyncClient]:  # noqa: ANN001
    async with app.router.lifespan_context(app):
        client = await _signed_in(app, "ministry@strata.demo")
        yield client
        await client.aclose()


@pytest.fixture
def idem() -> dict[str, str]:
    """Every create and action needs one; a fresh key per call."""
    return {"Idempotency-Key": str(uuid.uuid4())}
