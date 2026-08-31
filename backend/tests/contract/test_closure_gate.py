"""The closure gate.

The demo turns on this: a CAPA whose evidence was captured somewhere other
than the thing it claims to evidence cannot be closed, the refusal names the
measured distance, and the blocked attempt survives as a queryable record.
"""

from __future__ import annotations

import httpx
import pytest

pytestmark = pytest.mark.contract

BASE = "/api/v1"


async def _submitted_capa(client: httpx.AsyncClient) -> dict:
    listing = await client.get(f"{BASE}/capas?filter[status]=SUBMITTED&limit=1")
    rows = listing.json()["data"]
    if not rows:
        pytest.skip("no submitted CAPA in the dataset")
    return rows[0]


async def test_closure_is_blocked_when_evidence_is_off_target(
    manager: httpx.AsyncClient, idem: dict[str, str]
) -> None:
    capa = await _submitted_capa(manager)

    response = await manager.post(
        f"{BASE}/capas/{capa['id']}/actions",
        headers=idem,
        json={"action": "VERIFY", "expected_version": capa["version"]},
    )

    assert response.status_code == 422, response.text
    error = response.json()["error"]
    assert error["code"] == "EVIDENCE_INSUFFICIENT"
    assert error["details"]["outcome"] == "BLOCKED_DISTANCE_MISMATCH"


async def test_the_refusal_is_explainable(
    manager: httpx.AsyncClient, idem: dict[str, str]
) -> None:
    """"Insufficient evidence" is not an answer someone can act on. The
    measured distance and the radius it exceeded are."""
    capa = await _submitted_capa(manager)

    response = await manager.post(
        f"{BASE}/capas/{capa['id']}/actions",
        headers=idem,
        json={"action": "VERIFY", "expected_version": capa["version"]},
    )
    details = response.json()["error"]["details"]

    assert float(details["distance_m"]) > float(details["geofence_radius_m"])
    assert details["target_geometry_version_id"].startswith("ggv_")
    assert "m from the target" in details["explanation"]


async def test_a_blocked_attempt_is_a_permanent_record(
    manager: httpx.AsyncClient, idem: dict[str, str]
) -> None:
    """The refusal outlives the failed transaction. Without this the system
    can only say "it was blocked" and never prove it, which is the opposite of
    what the product claims."""
    capa = await _submitted_capa(manager)

    before = await manager.get(
        f"{BASE}/evidence-verification-attempts?filter[capa_id]={capa['id']}"
    )
    count_before = len(before.json()["data"])

    await manager.post(
        f"{BASE}/capas/{capa['id']}/actions",
        headers=idem,
        json={"action": "VERIFY", "expected_version": capa["version"]},
    )

    after = await manager.get(
        f"{BASE}/evidence-verification-attempts?filter[capa_id]={capa['id']}"
    )
    rows = after.json()["data"]
    assert len(rows) > count_before

    blocked = [r for r in rows if r["outcome"] == "BLOCKED_DISTANCE_MISMATCH"]
    assert blocked, "the blocked attempt was rolled back with the failed action"
    assert blocked[0]["within_geofence"] is False
    assert blocked[0]["distance_m"] is not None


async def test_the_capa_did_not_move(
    manager: httpx.AsyncClient, idem: dict[str, str]
) -> None:
    """A blocked closure leaves the record exactly where it was."""
    capa = await _submitted_capa(manager)

    await manager.post(
        f"{BASE}/capas/{capa['id']}/actions",
        headers=idem,
        json={"action": "VERIFY", "expected_version": capa["version"]},
    )

    after = (await manager.get(f"{BASE}/capas/{capa['id']}")).json()["data"]
    assert after["state"] == "SUBMITTED"
    assert after["version"] == capa["version"]
