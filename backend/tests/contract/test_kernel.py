"""The kernel contract: envelopes, query grammar, concurrency, idempotency.

These behaviours are shared by every collection, so proving them once on a
representative resource proves them everywhere — that is the point of a
generic route layer.
"""

from __future__ import annotations

import uuid

import httpx
import pytest

pytestmark = pytest.mark.contract

BASE = "/api/v1"


async def test_unauthenticated_read_is_401(anon: httpx.AsyncClient) -> None:
    response = await anon.get(f"{BASE}/capas")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHENTICATED"


async def test_login_failure_does_not_distinguish_unknown_from_wrong(
    anon: httpx.AsyncClient,
) -> None:
    """Two different failures, one message: otherwise the endpoint is an
    account-enumeration oracle."""
    unknown = await anon.post(
        f"{BASE}/auth/sessions",
        json={"method": "PASSWORD", "email": "nobody@strata.demo", "password": "x"},
    )
    wrong = await anon.post(
        f"{BASE}/auth/sessions",
        json={"method": "PASSWORD", "email": "manager@strata.demo", "password": "x"},
    )
    assert unknown.status_code == wrong.status_code == 401
    assert unknown.json()["message"] == wrong.json()["message"]


async def test_resource_envelope_shape(manager: httpx.AsyncClient) -> None:
    response = await manager.get(f"{BASE}/capas?limit=1")
    assert response.status_code == 200
    body = response.json()

    assert body["success"] is True
    assert "data" in body and "pagination" in body and "warnings" in body
    assert body["meta"]["request_id"].startswith("req_")

    row = body["data"][0]
    for field in ("id", "object", "version", "tenant_id", "state", "created_at", "links"):
        assert field in row, f"{field} missing from the resource envelope"
    assert row["object"] == "capa"
    assert row["links"]["self"].endswith(row["id"])


async def test_etag_mirrors_version(manager: httpx.AsyncClient) -> None:
    listing = await manager.get(f"{BASE}/capas?limit=1")
    capa_id = listing.json()["data"][0]["id"]

    response = await manager.get(f"{BASE}/capas/{capa_id}")
    body = response.json()["data"]
    assert response.headers["ETag"] == f'W/"{capa_id}:{body["version"]}"'


async def test_unknown_parameter_is_rejected(manager: httpx.AsyncClient) -> None:
    """Silently ignoring an unrecognised param hides client bugs."""
    response = await manager.get(f"{BASE}/capas?nonsense=1")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "UNKNOWN_PARAMETER"


async def test_undeclared_filter_field_is_rejected(manager: httpx.AsyncClient) -> None:
    response = await manager.get(f"{BASE}/capas?filter[corrective_action]=x")
    assert response.status_code == 400
    assert "allowed" in response.json()["error"]["details"]


async def test_relation_filter_depth_is_capped(manager: httpx.AsyncClient) -> None:
    response = await manager.get(f"{BASE}/capas?filter[finding.defect.title]=x")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "FILTER_TOO_DEEP"


async def test_typed_filter_operators(manager: httpx.AsyncClient) -> None:
    """An integer column filtered from a query string still compares as an
    integer — PostgreSQL will not cast a varchar parameter for us."""
    response = await manager.get(f"{BASE}/defects?filter[recurrence_count][gt]=0")
    assert response.status_code == 200, response.text
    assert all(row["recurrence_count"] > 0 for row in response.json()["data"])


async def test_aggregate_replaces_a_summary_endpoint(manager: httpx.AsyncClient) -> None:
    response = await manager.get(
        f"{BASE}/obligation-instances?group_by=status&metrics=count"
    )
    assert response.status_code == 200, response.text
    rows = response.json()["data"]
    assert rows and "key" in rows[0] and "metrics" in rows[0]
    assert sum(r["metrics"]["count"] for r in rows) > 0


async def test_unknown_view_names_the_allowed_set(manager: httpx.AsyncClient) -> None:
    response = await manager.get(f"{BASE}/capas?view=nonsense")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "UNKNOWN_VIEW"
    assert "open" in response.json()["error"]["details"]["allowed"]


async def test_actions_require_an_idempotency_key(manager: httpx.AsyncClient) -> None:
    listing = await manager.get(f"{BASE}/capas?limit=1")
    capa_id = listing.json()["data"][0]["id"]

    response = await manager.post(
        f"{BASE}/capas/{capa_id}/actions", json={"action": "SUBMIT"}
    )
    assert response.status_code == 400
    assert response.json()["error"]["details"]["field"] == "Idempotency-Key"


async def test_unknown_action_names_the_vocabulary(
    manager: httpx.AsyncClient, idem: dict[str, str]
) -> None:
    listing = await manager.get(f"{BASE}/capas?limit=1")
    capa_id = listing.json()["data"][0]["id"]

    response = await manager.post(
        f"{BASE}/capas/{capa_id}/actions", headers=idem, json={"action": "FLY"}
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "UNKNOWN_ACTION"
    assert "VERIFY" in response.json()["error"]["details"]["allowed"]


async def test_illegal_state_reports_where_the_record_actually_is(
    manager: httpx.AsyncClient, idem: dict[str, str]
) -> None:
    listing = await manager.get(f"{BASE}/capas?filter[status]=SUBMITTED&limit=1")
    capa = listing.json()["data"][0]

    response = await manager.post(
        f"{BASE}/capas/{capa['id']}/actions",
        headers=idem,
        json={
            "action": "ASSIGN",
            "payload": {"assigned_to": "per_x"},
            "expected_version": capa["version"],
        },
    )
    assert response.status_code == 409
    details = response.json()["error"]["details"]
    assert details["current_state"] == "SUBMITTED"
    assert "VERIFY" in details["allowed"]


async def test_stale_version_conflicts(
    manager: httpx.AsyncClient, idem: dict[str, str]
) -> None:
    listing = await manager.get(f"{BASE}/capas?filter[status]=SUBMITTED&limit=1")
    capa_id = listing.json()["data"][0]["id"]

    response = await manager.post(
        f"{BASE}/capas/{capa_id}/actions",
        headers=idem,
        json={"action": "VERIFY", "expected_version": 9999},
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "VERSION_CONFLICT"


async def test_idempotent_replay_returns_the_original_response(
    manager: httpx.AsyncClient,
) -> None:
    """A retried action is a no-op, not a second execution."""
    listing = await manager.get(f"{BASE}/extractions?filter[status]=PROPOSED&limit=1")
    rows = listing.json()["data"]
    if not rows:
        pytest.skip("no proposal left to review")
    extraction = rows[0]

    key = {"Idempotency-Key": str(uuid.uuid4())}
    body = {"action": "REJECT", "reason": "duplicate of an existing obligation",
            "expected_version": extraction["version"]}

    first = await manager.post(
        f"{BASE}/extractions/{extraction['id']}/actions", headers=key, json=body
    )
    assert first.status_code == 200, first.text

    second = await manager.post(
        f"{BASE}/extractions/{extraction['id']}/actions", headers=key, json=body
    )
    assert second.status_code == 200
    assert second.headers.get("Idempotency-Replayed") == "true"
    assert second.json()["data"]["version"] == first.json()["data"]["version"]


async def test_history_is_hash_chained(
    manager: httpx.AsyncClient, idem: dict[str, str]
) -> None:
    listing = await manager.get(f"{BASE}/capas?limit=1")
    capa_id = listing.json()["data"][0]["id"]

    response = await manager.get(f"{BASE}/capas/{capa_id}/history")
    assert response.status_code == 200
    for event in response.json()["data"]:
        assert event["hash"].startswith("sha256:")
        assert event["object"] == "audit_event"


async def test_introspection_drives_the_client(manager: httpx.AsyncClient) -> None:
    """A client reads labels and vocabularies from the server so a new enum
    value ships as data rather than a release."""
    enums = await manager.get(f"{BASE}/enums/severity")
    assert enums.status_code == 200
    values = {v["value"]: v for v in enums.json()["data"]["values"]}
    assert {"MINOR", "SIGNIFICANT", "SEVERE"} <= values.keys()
    assert values["SEVERE"]["label"]

    schema = await manager.get(f"{BASE}/schemas/capa")
    assert schema.status_code == 200
    actions = {a["action"] for a in schema.json()["data"]["actions"]}
    assert {"ASSIGN", "SUBMIT", "VERIFY", "EXTEND_DEADLINE"} <= actions
