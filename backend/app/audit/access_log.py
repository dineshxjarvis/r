"""Purpose-logged reads.

A regulator reading an operator's record is not a state change and has no
before/after to chain, but it still has to be recorded with a purpose.
Denials are logged too — an attempt that was refused is exactly the thing an
oversight review needs to see.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ids import new_id


async def write_access_event(
    session: AsyncSession,
    *,
    principal_id: str,
    object_type: str,
    granted: bool,
    tenant_id: str | None = None,
    person_id: str | None = None,
    object_id: str | None = None,
    purpose: str | None = None,
    fields: list[str] | None = None,
    requested_scope: dict[str, Any] | None = None,
    effective_scope: dict[str, Any] | None = None,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO access_event (
              id, tenant_id, principal_id, person_id, purpose,
              object_type, object_id, fields,
              requested_scope, effective_scope, granted
            ) VALUES (
              :id, :tenant_id, :principal_id, :person_id, :purpose,
              :object_type, :object_id, :fields,
              CAST(:requested_scope AS jsonb), CAST(:effective_scope AS jsonb), :granted
            )
            """
        ),
        {
            "id": new_id("access_event"),
            "tenant_id": tenant_id,
            "principal_id": principal_id,
            "person_id": person_id,
            "purpose": purpose,
            "object_type": object_type,
            "object_id": object_id,
            "fields": fields,
            "requested_scope": _json(requested_scope),
            "effective_scope": _json(effective_scope),
            "granted": granted,
        },
    )


def _json(value: Any) -> str | None:
    if value is None:
        return None
    import json

    return json.dumps(value, default=str)
