"""Hash-chained domain audit events.

Written explicitly, in the same transaction as the domain change and the
outbox row. Not a generic trigger: a trigger cannot know the acting
appointment, the reason text, or the business transition, and an audit trail
that records `UPDATE` without recording `who, under what authority, why` is
not an audit trail.

The chain locks the stream head row rather than selecting the latest event,
because an empty chain has nothing to lock and two concurrent first-writes
would both see nothing and both claim sequence 1.
"""

from __future__ import annotations

import hashlib
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ids import new_id
from app.core.time import isoformat, utcnow


def stream_key_for(tenant_id: str | None) -> str:
    """One chain per tenant, plus an explicit platform chain.

    Per-tenant chains mean a tenant's audit trail is independently verifiable
    and exportable without exposing or depending on another tenant's events.
    """
    return f"tenant:{tenant_id}" if tenant_id else "platform"


def compute_hash(
    *,
    prev_hash: str | None,
    event_id: str,
    action: str,
    object_type: str,
    object_id: str,
    occurred_at: str,
    before: Any,
    after: Any,
) -> str:
    payload = "|".join(
        [
            prev_hash or "",
            event_id,
            action,
            object_type,
            object_id,
            occurred_at,
            "" if before is None else str(before),
            "" if after is None else str(after),
        ]
    )
    return "sha256:" + hashlib.sha256(payload.encode()).hexdigest()


async def write_audit_event(
    session: AsyncSession,
    *,
    tenant_id: str | None,
    action: str,
    object_type: str,
    object_id: str,
    actor_principal_id: str | None = None,
    actor_person_id: str | None = None,
    acting_appointment_id: str | None = None,
    acting_mandate_assignment_id: str | None = None,
    transition_from: str | None = None,
    transition_to: str | None = None,
    changes: list[dict[str, Any]] | None = None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    reason: str | None = None,
    request_id: str | None = None,
    trace_id: str | None = None,
    effective_at: Any = None,
    source: str = "api",
) -> str:
    """Append one event to its stream. Returns the event id."""
    stream_key = stream_key_for(tenant_id)
    now = utcnow()
    event_id = new_id("domain_audit_event")

    # Create the head if this stream has never been written, then lock it.
    await session.execute(
        text(
            """
            INSERT INTO audit_stream_head (stream_key, last_sequence, last_hash)
            VALUES (:k, 0, NULL)
            ON CONFLICT (stream_key) DO NOTHING
            """
        ),
        {"k": stream_key},
    )
    head = (
        (
            await session.execute(
                text(
                    """
                SELECT last_sequence, last_hash
                FROM audit_stream_head
                WHERE stream_key = :k
                FOR UPDATE
                """
                ),
                {"k": stream_key},
            )
        )
        .mappings()
        .one()
    )

    sequence_no = head["last_sequence"] + 1
    prev_hash = head["last_hash"]
    occurred_at_iso = isoformat(now) or ""

    event_hash = compute_hash(
        prev_hash=prev_hash,
        event_id=event_id,
        action=action,
        object_type=object_type,
        object_id=object_id,
        occurred_at=occurred_at_iso,
        before=before,
        after=after,
    )

    await session.execute(
        text(
            """
            INSERT INTO domain_audit_event (
              id, stream_key, sequence_no, tenant_id, occurred_at, effective_at,
              actor_principal_id, actor_person_id, acting_appointment_id,
              acting_mandate_assignment_id, action, object_type, object_id,
              transition_from, transition_to, changes, before, after, reason,
              request_id, trace_id, source, prev_hash, hash
            ) VALUES (
              :id, :stream_key, :sequence_no, :tenant_id, :occurred_at, :effective_at,
              :actor_principal_id, :actor_person_id, :acting_appointment_id,
              :acting_mandate_assignment_id, :action, :object_type, :object_id,
              :transition_from, :transition_to,
              CAST(:changes AS jsonb), CAST(:before AS jsonb), CAST(:after AS jsonb),
              :reason, :request_id, :trace_id, :source, :prev_hash, :hash
            )
            """
        ),
        {
            "id": event_id,
            "stream_key": stream_key,
            "sequence_no": sequence_no,
            "tenant_id": tenant_id,
            "occurred_at": now,
            "effective_at": effective_at,
            "actor_principal_id": actor_principal_id,
            "actor_person_id": actor_person_id,
            "acting_appointment_id": acting_appointment_id,
            "acting_mandate_assignment_id": acting_mandate_assignment_id,
            "action": action,
            "object_type": object_type,
            "object_id": object_id,
            "transition_from": transition_from,
            "transition_to": transition_to,
            "changes": _json(changes),
            "before": _json(before),
            "after": _json(after),
            "reason": reason,
            "request_id": request_id,
            "trace_id": trace_id,
            "source": source,
            "prev_hash": prev_hash,
            "hash": event_hash,
        },
    )

    await session.execute(
        text(
            """
            UPDATE audit_stream_head
            SET last_sequence = :seq, last_hash = :hash, updated_at = now()
            WHERE stream_key = :k
            """
        ),
        {"seq": sequence_no, "hash": event_hash, "k": stream_key},
    )

    return event_id


def _json(value: Any) -> str | None:
    if value is None:
        return None
    import json

    return json.dumps(value, default=str)


async def read_history(
    session: AsyncSession,
    *,
    object_type: str,
    object_id: str,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """GET /{collection}/{id}/history — the same shape for every resource."""
    rows = (
        (
            await session.execute(
                text(
                    """
                SELECT e.id, e.sequence_no, e.occurred_at, e.effective_at, e.action,
                       e.actor_person_id, e.acting_appointment_id,
                       e.transition_from, e.transition_to, e.changes, e.reason,
                       e.request_id, e.hash, e.prev_hash,
                       p.display_name AS actor_display
                FROM domain_audit_event e
                LEFT JOIN person p ON p.id = e.actor_person_id
                WHERE e.object_type = :ot AND e.object_id = :oid
                ORDER BY e.sequence_no DESC
                LIMIT :limit OFFSET :offset
                """
                ),
                {"ot": object_type, "oid": object_id, "limit": limit, "offset": offset},
            )
        )
        .mappings()
        .all()
    )

    return [
        {
            "id": r["id"],
            "object": "audit_event",
            "sequence": r["sequence_no"],
            "occurred_at": isoformat(r["occurred_at"]),
            "effective_at": isoformat(r["effective_at"]),
            "action": r["action"],
            "actor": {
                "type": "person",
                "id": r["actor_person_id"],
                "display": r["actor_display"],
            }
            if r["actor_person_id"]
            else None,
            "acting_as": {"appointment_id": r["acting_appointment_id"]}
            if r["acting_appointment_id"]
            else None,
            "resource": {"type": object_type, "id": object_id},
            "transition": {"from": r["transition_from"], "to": r["transition_to"]}
            if r["transition_to"]
            else None,
            "changes": r["changes"] or [],
            "reason": r["reason"],
            "request_id": r["request_id"],
            "hash": r["hash"],
            "prev_hash": r["prev_hash"],
        }
        for r in rows
    ]
