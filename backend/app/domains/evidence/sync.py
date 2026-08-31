"""POST /evidence/sync — offline capture reconciliation.

An idempotent upsert keyed on the client-generated ULID. A retried sync after
a dropped connection is a no-op, not a duplicate row, and that property comes
from the ID being the client's rather than from any server-side bookkeeping.

The verdict is computed here, once, from what the device reported: chain
continuity, mock-location flag, clock consistency and capture path. It is
never recomputed later and never mutated — a manager overriding it is a
separate, recorded act on a verification attempt.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, text

from app.core.errors import ValidationError
from app.core.time import utcnow
from app.domains.evidence.models import Evidence
from app.kernel import idempotency
from app.kernel.deps import RequestContext, context
from app.kernel.envelope import success

router = APIRouter()

MAX_BATCH = 200


class CaptureIn(BaseModel):
    """One captured record as the device recorded it.

    Three clocks travel together because none of them alone is trustworthy:
    the wall clock can be wrong or tampered with, the monotonic counter is
    only comparable within one boot, and the server's arrival time says
    nothing about when the photo was actually taken. Together they bound the
    capture to an interval, which is the honest answer.
    """

    id: str
    mine_id: str
    device_id: str
    chain_sequence: int
    prev_hash: str | None = None
    upload_id: str | None = None
    content_hash: str
    content_type: str = "image/jpeg"
    byte_size: int = 0
    media_type: str = "PHOTO"
    capture_path: str = "DIRECT"
    captured_at_wall: Any
    captured_at_monotonic_ns: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    location_accuracy_m: float | None = None
    is_mock_location: bool = False
    device_integrity_verdict: dict[str, Any] | None = None
    for_capa_id: str | None = None
    for_instance_id: str | None = None
    for_defect_id: str | None = None
    for_observation_id: str | None = None
    at_subunit_id: str | None = None
    at_asset_id: str | None = None
    client_schema_version: int = 1


class SyncRequest(BaseModel):
    captures: list[CaptureIn]


def compute_verdict(capture: CaptureIn, *, chain_ok: bool) -> tuple[str, list[dict[str, Any]]]:
    """Intrinsic trustworthiness of one capture.

    Ordered by severity of what it implies. A mock location or a broken chain
    is an integrity failure, not a quality problem, so it caps the verdict at
    SUSPECT regardless of how good everything else looks.
    """
    reasons: list[dict[str, Any]] = []

    if capture.is_mock_location:
        reasons.append({"code": "MOCK_LOCATION", "detail": "device reported a mock provider"})
        return "SUSPECT", reasons

    if not chain_ok:
        reasons.append(
            {
                "code": "CHAIN_BROKEN",
                "detail": "prev_hash does not match this device's last capture",
            }
        )
        return "SUSPECT", reasons

    if capture.capture_path == "IMPORTED":
        # An imported file has no capture-time provenance at all, so it can
        # never reach VERIFIED however plausible it looks.
        reasons.append({"code": "IMPORTED", "detail": "not captured in-app"})
        return "UNVERIFIED", reasons

    if capture.latitude is None or capture.longitude is None:
        reasons.append({"code": "NO_LOCATION", "detail": "no position was recorded"})
        return "UNVERIFIED", reasons

    if capture.location_accuracy_m is not None and capture.location_accuracy_m > 50:
        reasons.append(
            {
                "code": "LOW_ACCURACY",
                "detail": f"position accurate only to {capture.location_accuracy_m} m",
            }
        )
        return "PLAUSIBLE", reasons

    if capture.captured_at_monotonic_ns is None:
        reasons.append({"code": "NO_MONOTONIC_CLOCK", "detail": "wall clock only"})
        return "PLAUSIBLE", reasons

    return "VERIFIED", reasons


@router.post("/evidence/sync")
async def sync_evidence(
    body: SyncRequest, ctx: RequestContext = Depends(context)
) -> dict[str, Any]:
    idempotency.require_key(ctx.idempotency_key, "POST /evidence/sync")

    if len(body.captures) > MAX_BATCH:
        raise ValidationError(
            f"a sync batch carries at most {MAX_BATCH} captures",
            {"supplied": len(body.captures)},
        )
    if not ctx.principal.holds("evidence.capture"):
        from app.authz.concealment import refuse

        raise refuse("SYNC", "evidence.capture", "evidence")

    now = utcnow()
    results: list[dict[str, Any]] = []
    accepted = 0
    replayed = 0

    for capture in body.captures:
        existing = await ctx.session.get(Evidence, capture.id)
        if existing is not None:
            # The whole point of client-generated IDs: this is a retry, not a
            # second capture. Report it as accepted so the device can clear
            # its queue instead of retrying forever.
            replayed += 1
            results.append(
                {"id": capture.id, "status": "ALREADY_SYNCED", "verdict": existing.verdict}
            )
            continue

        chain_ok = await _chain_intact(ctx, capture)
        verdict, reasons = compute_verdict(capture, chain_ok=chain_ok)

        evidence = Evidence(
            id=capture.id,
            tenant_id=ctx.principal.tenant_id,
            mine_id=capture.mine_id,
            captured_by_person_id=ctx.principal.person_id,
            capture_path=capture.capture_path,
            media_type=capture.media_type,
            content_hash=capture.content_hash,
            storage_bucket="strata-originals",
            storage_key=f"sha256/{capture.content_hash}",
            byte_size=capture.byte_size,
            content_type=capture.content_type,
            client_schema_version=capture.client_schema_version,
            device_id=capture.device_id,
            chain_sequence=capture.chain_sequence,
            prev_hash=capture.prev_hash,
            device_integrity_verdict=capture.device_integrity_verdict,
            location_accuracy_m=capture.location_accuracy_m,
            is_mock_location=capture.is_mock_location,
            captured_at_wall=capture.captured_at_wall,
            captured_at_monotonic_ns=capture.captured_at_monotonic_ns,
            server_received_at=now,
            verdict=verdict,
            verdict_reasons=reasons,
            for_capa_id=capture.for_capa_id,
            for_instance_id=capture.for_instance_id,
            for_defect_id=capture.for_defect_id,
            for_observation_id=capture.for_observation_id,
            at_subunit_id=capture.at_subunit_id,
            at_asset_id=capture.at_asset_id,
            synced_at=now,
            row_version=1,
            created_at=now,
            updated_at=now,
        )
        ctx.session.add(evidence)
        await ctx.session.flush()

        if capture.latitude is not None and capture.longitude is not None:
            # Written through PostGIS rather than assembled in Python, so the
            # geography type and SRID are the database's decision.
            await ctx.session.execute(
                text(
                    """
                    UPDATE evidence
                    SET location = ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
                    WHERE id = :id
                    """
                ),
                {"lon": capture.longitude, "lat": capture.latitude, "id": capture.id},
            )

        accepted += 1
        results.append(
            {"id": capture.id, "status": "SYNCED", "verdict": verdict, "reasons": reasons}
        )

    return success(
        {
            "requested": len(body.captures),
            "accepted": accepted,
            "already_synced": replayed,
            "results": results,
        },
        request_id=ctx.request_id,
        message=f"{accepted} capture(s) synced",
    )


async def _chain_intact(ctx: RequestContext, capture: CaptureIn) -> bool:
    """Does this capture follow the last one this device sent?

    A gap or a mismatched prev_hash means captures were dropped, reordered or
    fabricated — any of which makes the sequence untrustworthy even if this
    individual photo is fine.
    """
    previous = (
        await ctx.session.execute(
            select(Evidence)
            .where(
                Evidence.device_id == capture.device_id,
                Evidence.chain_sequence == capture.chain_sequence - 1,
            )
            .limit(1)
        )
    ).scalar_one_or_none()

    if previous is None:
        # First capture from this device is allowed to have no predecessor;
        # a later sequence number with nothing before it is not.
        return capture.chain_sequence <= 1

    return capture.prev_hash == previous.content_hash
