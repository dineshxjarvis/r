"""Transactional outbox.

The third of the three writes that commit together. Anything another part of
the system must react to — an FGA tuple, a notification, a dashboard
projection, a signal evaluation — leaves through here, never through an
inline call to that subsystem inside the request.

Publication is at-least-once. Consumers deduplicate on message id and advance
their checkpoint only after durable processing.
"""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ids import new_id


async def write_outbox(
    session: AsyncSession,
    *,
    aggregate_type: str,
    aggregate_id: str,
    event_type: str,
    payload: dict[str, Any],
    tenant_id: str | None = None,
    audit_event_id: str | None = None,
) -> str:
    message_id = new_id("outbox_message")

    # Per-aggregate sequence, so a consumer can detect an out-of-order or
    # missing message rather than silently applying a stale one.
    next_seq = (
        await session.execute(
            text(
                """
                SELECT COALESCE(MAX(aggregate_seq), 0) + 1
                FROM outbox_message
                WHERE aggregate_type = :at AND aggregate_id = :aid
                """
            ),
            {"at": aggregate_type, "aid": aggregate_id},
        )
    ).scalar_one()

    await session.execute(
        text(
            """
            INSERT INTO outbox_message (
              id, tenant_id, aggregate_type, aggregate_id, aggregate_seq,
              event_type, payload, audit_event_id
            ) VALUES (
              :id, :tenant_id, :aggregate_type, :aggregate_id, :aggregate_seq,
              :event_type, CAST(:payload AS jsonb), :audit_event_id
            )
            """
        ),
        {
            "id": message_id,
            "tenant_id": tenant_id,
            "aggregate_type": aggregate_type,
            "aggregate_id": aggregate_id,
            "aggregate_seq": next_seq,
            "event_type": event_type,
            "payload": json.dumps(payload, default=str),
            "audit_event_id": audit_event_id,
        },
    )
    return message_id
