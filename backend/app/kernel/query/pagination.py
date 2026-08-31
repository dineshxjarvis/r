"""Pagination. Page-based by default, cursor only for live-appended streams.

Page numbers against a stream that grows at the head are meaningless — a row
inserted between two requests shifts every page boundary. Notifications,
audit events, access logs and signals are cursor-paginated for that reason;
everything else is page-based, which is what a table UI actually wants.
"""

from __future__ import annotations

import base64
import json
from typing import Any

from app.core.errors import ValidationError

# Above this, an exact COUNT on an authorization-clipped set costs more than
# the page render is worth. We report an estimate and say so.
COUNT_CEILING = 10_000


def page_envelope(*, page: int, limit: int, total: int | None) -> dict[str, Any]:
    if total is None:
        return {
            "page": page,
            "limit": limit,
            "total": None,
            "total_pages": None,
            "total_is_estimate": True,
            "has_next": True,
            "has_prev": page > 1,
        }
    total_pages = (total + limit - 1) // limit if limit else 0
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


def cursor_envelope(*, next_cursor: str | None) -> dict[str, Any]:
    return {"next_cursor": next_cursor, "has_more": next_cursor is not None}


def encode_cursor(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(cursor: str) -> dict[str, Any]:
    padded = cursor + "=" * (-len(cursor) % 4)
    try:
        return json.loads(base64.urlsafe_b64decode(padded.encode()))
    except (ValueError, TypeError) as exc:
        raise ValidationError(
            "cursor is not readable — restart the listing without one",
            {"field": "cursor"},
        ) from exc


def offset_for(page: int, limit: int) -> int:
    return (page - 1) * limit
