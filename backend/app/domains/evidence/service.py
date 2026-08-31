"""The closure gate: can this evidence close that target?

Verdict (is the capture trustworthy) and fitness (is *this* evidence close
enough to *that* target) are two different judgments. The first is intrinsic
and computed once at sync. The second depends on what the evidence is being
used to close, so it is evaluated per attempt — and every attempt, blocked or
accepted, leaves a permanent row.

That is what turns "closure blocked because the photo was taken 847 m from
the berm" into a queryable fact rather than a transient error message.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import session_scope
from app.core.ids import new_id
from app.core.time import utcnow
from app.domains.evidence.models import Evidence, EvidenceVerificationAttempt

# Fallback when no spatial policy row covers this purpose. Deliberately
# generous: a false block on a demo mine is worse than a loose radius, and the
# real number belongs in spatial_policy_version, not in code.
DEFAULT_GEOFENCE_RADIUS_M = Decimal("150")


class GateResult:
    """Outcome of one closure evaluation, plus the record that proves it."""

    def __init__(
        self,
        *,
        outcome: str,
        attempt_ids: list[str],
        detail: dict[str, Any],
    ) -> None:
        self.outcome = outcome
        self.attempt_ids = attempt_ids
        self.detail = detail

    @property
    def accepted(self) -> bool:
        return self.outcome in {"ACCEPTED", "ACCEPTED_WITH_OVERRIDE"}


async def linked_evidence(
    session: AsyncSession, *, capa_id: str | None = None, instance_id: str | None = None
) -> list[Evidence]:
    """Evidence carries the pointer to what it was captured for, not the
    other way round — which is what lets the authorization graph walk from a
    piece of evidence to the CAPA that governs who may see it."""
    stmt = select(Evidence)
    if capa_id:
        stmt = stmt.where(Evidence.for_capa_id == capa_id)
    elif instance_id:
        stmt = stmt.where(Evidence.for_instance_id == instance_id)
    else:
        return []
    return list((await session.execute(stmt)).scalars().all())


async def _target_geometry(
    session: AsyncSession, *, mine_id: str, subunit_id: str | None, asset_id: str | None
) -> dict[str, Any] | None:
    """The published geometry version this capture should fall inside.

    Most specific target wins: an asset geofence beats the mine boundary,
    because "somewhere on site" is not proof you fixed the berm.
    """
    row = (
        (
            await session.execute(
                text(
                    """
                SELECT ggv.id AS version_id, ggv.normalized_geometry,
                       spv.id AS policy_id, spv.tolerance_m, spv.predicate
                FROM governed_geometry gg
                JOIN governed_geometry_version ggv
                  ON ggv.governed_geometry_id = gg.id
                 AND ggv.status = 'PUBLISHED'
                 AND ggv.effective_from <= now()
                 AND (ggv.effective_until IS NULL OR ggv.effective_until > now())
                LEFT JOIN spatial_policy_version spv
                  ON spv.purpose = 'EVIDENCE_GEOFENCE'
                 AND spv.effective_from <= now()
                 AND (spv.effective_until IS NULL OR spv.effective_until > now())
                WHERE gg.mine_id = :mine_id
                  AND (CAST(:asset_id AS text) IS NULL OR gg.asset_id = :asset_id)
                  AND (CAST(:subunit_id AS text) IS NULL OR gg.subunit_id = :subunit_id)
                ORDER BY (gg.asset_id IS NOT NULL) DESC,
                         (gg.subunit_id IS NOT NULL) DESC,
                         ggv.version_no DESC
                LIMIT 1
                """
                ),
                {"mine_id": mine_id, "asset_id": asset_id, "subunit_id": subunit_id},
            )
        )
        .mappings()
        .first()
    )
    return dict(row) if row else None


async def _distance_to_target(
    session: AsyncSession, *, evidence_id: str, geometry_version_id: str
) -> Decimal | None:
    """Metres from the capture point to the target geometry, in PostGIS."""
    value = (
        await session.execute(
            text(
                """
                SELECT ST_Distance(e.location, ggv.normalized_geometry)
                FROM evidence e, governed_geometry_version ggv
                WHERE e.id = :eid AND ggv.id = :gid AND e.location IS NOT NULL
                """
            ),
            {"eid": evidence_id, "gid": geometry_version_id},
        )
    ).scalar_one_or_none()
    return Decimal(str(value)) if value is not None else None


async def can_close_with(
    session: AsyncSession,
    *,
    tenant_id: str,
    attempted_by_person_id: str,
    capa_id: str | None = None,
    obligation_instance_id: str | None = None,
    mine_id: str,
    subunit_id: str | None = None,
    asset_id: str | None = None,
    override_by_person_id: str | None = None,
    override_reason: str | None = None,
) -> GateResult:
    """Evaluate the gate and record every attempt it produced.

    Order matters: trust first, then completeness, then position. A tampered
    capture is not "far away", it is untrustworthy, and reporting the distance
    for it would imply the position meant something.
    """
    items = await linked_evidence(session, capa_id=capa_id, instance_id=obligation_instance_id)
    attempt_ids: list[str] = []

    if not items:
        attempt_id = await _record_attempt(
            session,
            tenant_id=tenant_id,
            capa_id=capa_id,
            obligation_instance_id=obligation_instance_id,
            evidence_id=None,
            attempted_by_person_id=attempted_by_person_id,
            outcome="BLOCKED_ALL_UNVERIFIED",
            detail={"reason": "no evidence is linked to this target"},
        )
        return GateResult(
            outcome="BLOCKED_ALL_UNVERIFIED",
            attempt_ids=[a for a in [attempt_id] if a],
            detail={"missing": "evidence", "linked_count": 0},
        )

    # 1. Trust. A SUSPECT capture blocks unless a specific override is supplied.
    suspect = [e for e in items if e.verdict == "SUSPECT"]
    if suspect and override_by_person_id is None:
        for item in suspect:
            attempt_ids.append(
                await _record_attempt(
                    session,
                    tenant_id=tenant_id,
                    capa_id=capa_id,
                    obligation_instance_id=obligation_instance_id,
                    evidence_id=item.id,
                    attempted_by_person_id=attempted_by_person_id,
                    outcome="BLOCKED_SUSPECT_EVIDENCE",
                    detail={"verdict_reasons": item.verdict_reasons},
                )
            )
        return GateResult(
            outcome="BLOCKED_SUSPECT_EVIDENCE",
            attempt_ids=attempt_ids,
            detail={
                "suspect_evidence_ids": [e.id for e in suspect],
                "override_capability": "evidence.override_verdict",
            },
        )

    # 2. Completeness. Unverifiable evidence alone can never satisfy closure.
    if all(e.verdict == "UNVERIFIED" for e in items):
        for item in items:
            attempt_ids.append(
                await _record_attempt(
                    session,
                    tenant_id=tenant_id,
                    capa_id=capa_id,
                    obligation_instance_id=obligation_instance_id,
                    evidence_id=item.id,
                    attempted_by_person_id=attempted_by_person_id,
                    outcome="BLOCKED_ALL_UNVERIFIED",
                    detail={"verdict": item.verdict},
                )
            )
        return GateResult(
            outcome="BLOCKED_ALL_UNVERIFIED",
            attempt_ids=attempt_ids,
            detail={"evidence_count": len(items)},
        )

    # 3. Position. This is the explainable block the demo turns on.
    target = await _target_geometry(
        session, mine_id=mine_id, subunit_id=subunit_id, asset_id=asset_id
    )
    if target is not None:
        radius = target.get("tolerance_m") or DEFAULT_GEOFENCE_RADIUS_M
        radius = Decimal(str(radius))
        located = [e for e in items if e.location is not None]

        for item in located:
            distance = await _distance_to_target(
                session, evidence_id=item.id, geometry_version_id=target["version_id"]
            )
            if distance is None:
                continue
            within = distance <= radius
            attempt_ids.append(
                await _record_attempt(
                    session,
                    tenant_id=tenant_id,
                    capa_id=capa_id,
                    obligation_instance_id=obligation_instance_id,
                    evidence_id=item.id,
                    attempted_by_person_id=attempted_by_person_id,
                    outcome="ACCEPTED" if within else "BLOCKED_DISTANCE_MISMATCH",
                    detail={
                        "distance_m": str(distance),
                        "geofence_radius_m": str(radius),
                        "target_geometry_version_id": target["version_id"],
                    },
                    distance_m=distance,
                    geofence_radius_m=radius,
                    within_geofence=within,
                )
            )
            if not within:
                return GateResult(
                    outcome="BLOCKED_DISTANCE_MISMATCH",
                    attempt_ids=attempt_ids,
                    detail={
                        "evidence_id": item.id,
                        "distance_m": str(distance.quantize(Decimal("0.1"))),
                        "geofence_radius_m": str(radius),
                        "target_geometry_version_id": target["version_id"],
                        "explanation": (
                            f"capture is {distance.quantize(Decimal('0.1'))} m from the "
                            f"target, outside the {radius} m geofence"
                        ),
                    },
                )

    # 4. Accepted, with or without an override of a suspect capture.
    outcome = "ACCEPTED_WITH_OVERRIDE" if override_by_person_id else "ACCEPTED"
    attempt_ids.append(
        await _record_attempt(
            session,
            tenant_id=tenant_id,
            capa_id=capa_id,
            obligation_instance_id=obligation_instance_id,
            evidence_id=items[0].id,
            attempted_by_person_id=attempted_by_person_id,
            outcome=outcome,
            detail={"evidence_count": len(items)},
            override_by_person_id=override_by_person_id,
            override_reason=override_reason,
        )
    )
    return GateResult(
        outcome=outcome,
        attempt_ids=attempt_ids,
        detail={"evidence_count": len(items)},
    )


async def _record_attempt(
    _session: AsyncSession,
    *,
    tenant_id: str,
    capa_id: str | None,
    obligation_instance_id: str | None,
    evidence_id: str | None,
    attempted_by_person_id: str,
    outcome: str,
    detail: dict[str, Any],
    distance_m: Decimal | None = None,
    geofence_radius_m: Decimal | None = None,
    within_geofence: bool | None = None,
    override_by_person_id: str | None = None,
    override_reason: str | None = None,
) -> str:
    """Record one evaluation on its own durable append path.

    A blocked gate raises, which rolls the domain transaction back — and the
    blocked attempt would roll back with it, leaving no trace of the thing
    the product exists to prove. So the attempt commits in its own
    transaction: the evaluation happened whether or not the closure did.

    The trade is an accepted attempt surviving a domain failure further down.
    That is the right way round: an orphan record of an evaluation that
    genuinely ran is honest, a missing record of a refusal is not.
    """
    if evidence_id is None:
        return ""

    attempt_id = new_id("evidence_verification_attempt")
    async with session_scope(tenant_id=tenant_id) as own:
        own.add(
            EvidenceVerificationAttempt(
                id=attempt_id,
                tenant_id=tenant_id,
                capa_id=capa_id,
                obligation_instance_id=obligation_instance_id,
                evidence_id=evidence_id,
                attempted_by_person_id=attempted_by_person_id,
                attempted_at=utcnow(),
                distance_m=distance_m,
                geofence_radius_m=geofence_radius_m,
                within_geofence=within_geofence,
                outcome=outcome,
                reason_detail=detail,
                override_by_person_id=override_by_person_id,
                override_reason=override_reason,
            )
        )
    return attempt_id
