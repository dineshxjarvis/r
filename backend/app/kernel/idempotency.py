"""Idempotency keys.

Required on every create and every /actions call. The key is scoped to
(principal, route, target) for 24 hours; a replay returns the original
response with `Idempotency-Replayed: true` rather than executing again.

A replay carrying a *different* body is not a replay — it is a client bug,
and returning the first response for it would silently discard the second
request. That case is a 422.
"""

from __future__ import annotations

import hashlib
import json
from datetime import timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import Unprocessable, ValidationError
from app.core.ids import new_id
from app.core.time import utcnow

RETENTION = timedelta(hours=24)


def body_hash(body: Any) -> str:
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()


def require_key(key: str | None, route: str) -> str:
    if not key:
        raise ValidationError(
            "this call requires an Idempotency-Key header",
            {"field": "Idempotency-Key", "route": route},
        )
    return key


async def replay(
    session: AsyncSession,
    *,
    principal_id: str,
    route: str,
    target: str,
    key: str,
    request_body: Any,
) -> dict[str, Any] | None:
    """Return the stored response if this exact call already ran."""
    row = (
        (
            await session.execute(
                text(
                    """
                SELECT request_hash, response_status, response_body
                FROM idempotency_key
                WHERE principal_id = :p AND route = :r AND target = :t AND idem_key = :k
                  AND expires_at > :now
                """
                ),
                {
                    "p": principal_id,
                    "r": route,
                    "t": target,
                    "k": key,
                    "now": utcnow(),
                },
            )
        )
        .mappings()
        .first()
    )

    if row is None:
        return None

    if row["request_hash"] != body_hash(request_body):
        raise Unprocessable(
            "this Idempotency-Key was already used with a different request body",
            {"field": "Idempotency-Key"},
        )

    if row["response_body"] is None:
        # A concurrent request holds the key but has not finished. Telling the
        # caller to retry is honest; guessing the outcome is not.
        raise Unprocessable(
            "an identical request is still in flight; retry shortly",
            {"field": "Idempotency-Key"},
        )

    return {"status": row["response_status"], "body": row["response_body"]}


async def reserve(
    session: AsyncSession,
    *,
    principal_id: str,
    route: str,
    target: str,
    key: str,
    request_body: Any,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO idempotency_key
              (id, principal_id, route, target, idem_key, request_hash, expires_at)
            VALUES (:id, :p, :r, :t, :k, :h, :exp)
            ON CONFLICT (principal_id, route, target, idem_key) DO NOTHING
            """
        ),
        {
            "id": new_id("idempotency_key"),
            "p": principal_id,
            "r": route,
            "t": target,
            "k": key,
            "h": body_hash(request_body),
            "exp": utcnow() + RETENTION,
        },
    )


async def record(
    session: AsyncSession,
    *,
    principal_id: str,
    route: str,
    target: str,
    key: str,
    status: int,
    response_body: Any,
) -> None:
    await session.execute(
        text(
            """
            UPDATE idempotency_key
            SET response_status = :s, response_body = CAST(:b AS jsonb)
            WHERE principal_id = :p AND route = :r AND target = :t AND idem_key = :k
            """
        ),
        {
            "s": status,
            "b": json.dumps(response_body, default=str),
            "p": principal_id,
            "r": route,
            "t": target,
            "k": key,
        },
    )
