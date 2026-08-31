"""Resolve a session cookie into a principal and its current authority.

A cookie identifies a session, never a role, tenant, mine, regulator or
permission. Everything below is derived server-side from current, time-bounded
relationships — and re-derived on every request, because an appointment that
expired mid-session must deny the next call.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import Unauthenticated
from app.core.time import utcnow


def hash_session_id(raw_cookie: str) -> str:
    """The cookie carries the opaque ID; the table stores only its hash."""
    return hashlib.sha256(raw_cookie.encode()).hexdigest()


@dataclass(slots=True)
class Appointment:
    id: str
    post_id: str
    position_code: str
    scope_resource_type: str | None
    scope_resource_id: str | None
    organization_id: str
    mode: str


@dataclass(slots=True)
class Principal:
    """Who is acting, under what authority, right now."""

    principal_id: str
    person_id: str | None
    display_name: str
    assurance: str
    session_id_hash: str
    tenant_id: str | None
    appointments: list[Appointment] = field(default_factory=list)
    capabilities: frozenset[str] = frozenset()
    # The mines this principal holds authority over. None means "unclipped"
    # (a platform/portfolio principal); an empty list means no access at all.
    authorized_mine_ids: list[str] | None = None
    is_platform: bool = False

    def holds(self, capability: str) -> bool:
        return capability in self.capabilities

    def appointment_for_mine(self, mine_id: str) -> Appointment | None:
        for appointment in self.appointments:
            if (
                appointment.scope_resource_type == "mine"
                and appointment.scope_resource_id == mine_id
            ):
                return appointment
        return None

    def to_wire(self) -> dict[str, Any]:
        return {
            "principal_id": self.principal_id,
            "person": {"type": "person", "id": self.person_id, "display": self.display_name},
            "assurance": self.assurance,
            "tenant_id": self.tenant_id,
            "appointments": [
                {
                    "id": a.id,
                    "post_id": a.post_id,
                    "position_code": a.position_code,
                    "scope": {"type": a.scope_resource_type, "id": a.scope_resource_id},
                    "mode": a.mode,
                }
                for a in self.appointments
            ],
        }


async def resolve_session(session: AsyncSession, raw_cookie: str) -> Principal:
    """Session -> principal, or 401. Never a partially-trusted result."""
    id_hash = hash_session_id(raw_cookie)
    now = utcnow()

    row = (
        (
            await session.execute(
                text(
                    """
                SELECT s.id_hash, s.principal_id, s.assurance_level,
                       s.selected_tenant_id, s.credential_version,
                       p.credential_version AS current_credential_version,
                       p.status AS principal_status,
                       p.person_id, per.display_name, per.status AS person_status
                FROM session s
                JOIN principal p ON p.id = s.principal_id
                LEFT JOIN person per ON per.id = p.person_id
                WHERE s.id_hash = :id_hash
                  AND s.revoked_at IS NULL
                  AND s.idle_expires_at > :now
                  AND s.absolute_expires_at > :now
                """
                ),
                {"id_hash": id_hash, "now": now},
            )
        )
        .mappings()
        .first()
    )

    if row is None:
        raise Unauthenticated("no active session")

    # A credential change bumps principal.credential_version, which invalidates
    # every session issued before it without needing to find and delete them.
    if row["credential_version"] != row["current_credential_version"]:
        raise Unauthenticated("credentials changed since this session was issued")
    if row["principal_status"] != "ACTIVE":
        raise Unauthenticated("account is not active")

    principal = Principal(
        principal_id=row["principal_id"],
        person_id=row["person_id"],
        display_name=row["display_name"] or "Unknown",
        assurance=row["assurance_level"],
        session_id_hash=id_hash,
        tenant_id=row["selected_tenant_id"],
    )

    await session.execute(
        text("UPDATE session SET last_seen_at = :now WHERE id_hash = :h"),
        {"now": now, "h": id_hash},
    )

    if principal.person_id:
        principal.appointments = await _load_appointments(session, principal.person_id, now)
        principal.capabilities = await _load_capabilities(session, principal.appointments, now)
        principal.authorized_mine_ids = await _load_mine_scope(session, principal, now)
    return principal


async def _load_appointments(session: AsyncSession, person_id: str, now: Any) -> list[Appointment]:
    """Only appointments that are live at this instant.

    No nightly job revokes anything: the interval is checked here, so an
    appointment that lapsed a minute ago is already gone from this list.
    """
    rows = (
        (
            await session.execute(
                text(
                    """
                SELECT a.id, a.post_id, a.mode,
                       pt.code AS position_code,
                       po.scope_resource_type, po.scope_resource_id,
                       po.organization_id
                FROM appointment a
                JOIN post po ON po.id = a.post_id
                JOIN position_template pt ON pt.id = po.position_template_id
                WHERE a.person_id = :person_id
                  AND a.revoked_at IS NULL
                  AND a.superseded_by_id IS NULL
                  AND a.valid_from <= :now
                  AND a.valid_until > :now
                  AND po.status = 'ACTIVE'
                """
                ),
                {"person_id": person_id, "now": now},
            )
        )
        .mappings()
        .all()
    )

    return [
        Appointment(
            id=r["id"],
            post_id=r["post_id"],
            position_code=r["position_code"],
            scope_resource_type=r["scope_resource_type"],
            scope_resource_id=r["scope_resource_id"],
            organization_id=r["organization_id"],
            mode=r["mode"],
        )
        for r in rows
    ]


async def _load_capabilities(
    session: AsyncSession, appointments: list[Appointment], now: Any
) -> frozenset[str]:
    """Capabilities come from two independent sources, unioned.

    Position policy grants organisational capabilities; a mandate grants
    regulator ones. Neither is implied by a job title — both are explicit
    rows, and a regulator with no mandate assignment holds nothing.
    """
    if not appointments:
        return frozenset()

    post_ids = [a.post_id for a in appointments]
    appointment_ids = [a.id for a in appointments]

    from_position = (
        (
            await session.execute(
                text(
                    """
                SELECT DISTINCT c.code
                FROM position_capability_policy pcp
                JOIN capability c ON c.id = pcp.capability_id
                JOIN post po ON po.position_template_id = pcp.position_template_id
                WHERE po.id = ANY(:post_ids)
                """
                ),
                {"post_ids": post_ids},
            )
        )
        .scalars()
        .all()
    )

    from_mandate = (
        (
            await session.execute(
                text(
                    """
                SELECT DISTINCT c.code
                FROM mandate_assignment ma
                JOIN mandate_capability mc ON mc.mandate_id = ma.mandate_id
                JOIN capability c ON c.id = mc.capability_id
                WHERE ma.appointment_id = ANY(:appointment_ids)
                  AND ma.revoked_at IS NULL
                  AND ma.superseded_by_id IS NULL
                  AND ma.valid_from <= :now
                  AND ma.valid_until > :now
                """
                ),
                {"appointment_ids": appointment_ids, "now": now},
            )
        )
        .scalars()
        .all()
    )

    return frozenset({*from_position, *from_mandate})


async def _load_mine_scope(
    session: AsyncSession, principal: Principal, now: Any
) -> list[str] | None:
    """The authorized resource set, computed rather than claimed.

    A mine-scoped appointment covers that mine. A tenant-scoped one covers
    the tenant's mines. A regulator's coverage comes from a jurisdiction
    assignment, which is time-bounded and superseded on redistricting.
    """
    mine_ids: set[str] = set()
    unclipped = False

    for appointment in principal.appointments:
        if appointment.scope_resource_type == "mine" and appointment.scope_resource_id:
            mine_ids.add(appointment.scope_resource_id)
        elif appointment.scope_resource_type == "tenant" and appointment.scope_resource_id:
            rows = (
                (
                    await session.execute(
                        text("SELECT id FROM mine WHERE tenant_id = :t"),
                        {"t": appointment.scope_resource_id},
                    )
                )
                .scalars()
                .all()
            )
            mine_ids.update(rows)

    jurisdictions = (
        (
            await session.execute(
                text(
                    """
                SELECT selector_type, selector_payload
                FROM jurisdiction_assignment
                WHERE appointment_id = ANY(:appointment_ids)
                  AND revoked_at IS NULL
                  AND superseded_by_id IS NULL
                  AND valid_from <= :now
                  AND valid_until > :now
                """
                ),
                {
                    "appointment_ids": [a.id for a in principal.appointments] or [""],
                    "now": now,
                },
            )
        )
        .mappings()
        .all()
    )

    for jurisdiction in jurisdictions:
        payload = jurisdiction["selector_payload"] or {}
        selector = jurisdiction["selector_type"]
        if selector == "MINE_SET":
            mine_ids.update(payload.get("mine_ids", []))
        elif selector == "TENANT":
            rows = (
                (
                    await session.execute(
                        text("SELECT id FROM mine WHERE tenant_id = ANY(:t)"),
                        {"t": payload.get("tenant_ids", [])},
                    )
                )
                .scalars()
                .all()
            )
            mine_ids.update(rows)
        elif selector == "STATE":
            rows = (
                (
                    await session.execute(
                        text("SELECT id FROM mine WHERE state_code = ANY(:s)"),
                        {"s": payload.get("state_codes", [])},
                    )
                )
                .scalars()
                .all()
            )
            mine_ids.update(rows)
        elif selector == "PLATFORM_PORTFOLIO":
            unclipped = True

    if unclipped:
        # Not "no filter" — a computed authorized resource set that happens
        # to span tenants. The contract requires a cross-tenant read to
        # calculate its scope and query only that set, so the list is made
        # explicit here rather than left as an absent WHERE clause.
        principal.is_platform = True
        rows = (
            (await session.execute(text("SELECT mine_id FROM resolve_all_mines()"))).scalars().all()
        )
        mine_ids.update(rows)

    return sorted(mine_ids)
