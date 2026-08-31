"""Authorization boundaries.

These are the tests the identity model asks for by name: scope conceals rather
than refuses, a portfolio principal is clipped to a computed set, authority is
re-derived per request, and one person cannot be both sides of a control.
"""

from __future__ import annotations

import httpx
import pytest

pytestmark = pytest.mark.contract

BASE = "/api/v1"


async def test_scope_clips_an_operator_to_their_own_mine(
    manager: httpx.AsyncClient,
) -> None:
    me = (await manager.get(f"{BASE}/users/me")).json()["data"]
    assert me["scope"]["portfolio"] is False
    assert me["scope"]["mine_count"] == 1

    mines = (await manager.get(f"{BASE}/mines")).json()["data"]
    assert len(mines) == 1


async def test_portfolio_principal_reads_across_tenants(
    ministry: httpx.AsyncClient,
) -> None:
    """Cross-tenant access is a governed capability, not an absent filter —
    the scope is still a finite, reportable set."""
    me = (await ministry.get(f"{BASE}/users/me")).json()["data"]
    assert me["scope"]["portfolio"] is True
    assert me["scope"]["mine_count"] == 3

    mines = (await ministry.get(f"{BASE}/mines")).json()["data"]
    assert len(mines) == 3


async def test_out_of_scope_object_is_concealed_not_refused(
    manager: httpx.AsyncClient, ministry: httpx.AsyncClient
) -> None:
    """404, never 403 — a 403 would confirm the object exists."""
    all_mines = (await ministry.get(f"{BASE}/mines")).json()["data"]
    mine_ids = {m["id"] for m in all_mines}
    own = {m["id"] for m in (await manager.get(f"{BASE}/mines")).json()["data"]}
    other = next(iter(mine_ids - own))

    response = await manager.get(f"{BASE}/mines/{other}")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


async def test_capability_the_principal_lacks_is_refused(
    ministry: httpx.AsyncClient, idem: dict[str, str]
) -> None:
    """A ministry analyst can see a CAPA and still not close one. Visible but
    not permitted is exactly what 403 is reserved for."""
    listing = await ministry.get(f"{BASE}/capas?filter[status]=SUBMITTED&limit=1")
    rows = listing.json()["data"]
    if not rows:
        pytest.skip("no submitted CAPA to attempt")
    capa = rows[0]

    response = await ministry.post(
        f"{BASE}/capas/{capa['id']}/actions",
        headers=idem,
        json={"action": "VERIFY", "expected_version": capa["version"]},
    )
    assert response.status_code in (403, 404)


async def test_available_actions_reflect_the_caller_not_the_record(
    manager: httpx.AsyncClient, safety_officer: httpx.AsyncClient
) -> None:
    """The same record, two principals, two different action lists. This is
    why a client must render controls from the array rather than the state."""
    listing = await manager.get(f"{BASE}/capas?filter[status]=SUBMITTED&limit=1")
    rows = listing.json()["data"]
    if not rows:
        pytest.skip("no submitted CAPA")
    capa_id = rows[0]["id"]

    as_manager = (await manager.get(f"{BASE}/capas/{capa_id}")).json()["data"]
    as_submitter = (await safety_officer.get(f"{BASE}/capas/{capa_id}")).json()["data"]

    assert "VERIFY" in as_manager["available_actions"]
    assert "VERIFY" not in as_submitter["available_actions"]


async def test_submitter_cannot_verify_their_own_work(
    safety_officer: httpx.AsyncClient, idem: dict[str, str]
) -> None:
    """Enforced in the policy layer and again by a CHECK constraint. This
    asserts the readable refusal, not the integrity error."""
    listing = await safety_officer.get(f"{BASE}/capas?filter[status]=SUBMITTED&limit=1")
    rows = listing.json()["data"]
    if not rows:
        pytest.skip("no submitted CAPA")
    capa = rows[0]

    response = await safety_officer.post(
        f"{BASE}/capas/{capa['id']}/actions",
        headers=idem,
        json={"action": "VERIFY", "expected_version": capa["version"]},
    )
    assert response.status_code in (403, 422)


async def test_capabilities_come_from_appointments_not_titles(
    manager: httpx.AsyncClient, ministry: httpx.AsyncClient
) -> None:
    manager_caps = set((await manager.get(f"{BASE}/users/me")).json()["data"]["capabilities"])
    ministry_caps = set((await ministry.get(f"{BASE}/users/me")).json()["data"]["capabilities"])

    assert "capa.verify" in manager_caps
    assert "capa.verify" not in ministry_caps
    assert "portfolio.read" in ministry_caps
    assert "portfolio.read" not in manager_caps
