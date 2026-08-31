"""Optimistic concurrency: version, ETag, If-Match.

Two people opening the same CAPA and both acting on it is normal, not an
edge case. The second write must be told the record moved rather than
silently overwriting the first.
"""

from __future__ import annotations

import re
from typing import Any

from app.core.errors import VersionConflict
from app.kernel.registry import ResourceSpec

ETAG = re.compile(r'^W/"(?P<id>[^:]+):(?P<version>\d+)"$')


def parse_if_match(header: str | None) -> int | None:
    """Accept either the full weak ETag or a bare version number."""
    if not header:
        return None
    header = header.strip()
    match = ETAG.match(header)
    if match:
        return int(match.group("version"))
    if header.isdigit():
        return int(header)
    return None


def check_version(
    spec: ResourceSpec,
    obj: Any,
    *,
    expected_version: int | None,
    if_match: str | None,
    required: bool,
) -> None:
    """Compare the caller's view of the record against the stored one."""
    if not spec.version_field:
        return

    expected = expected_version if expected_version is not None else parse_if_match(if_match)
    current = getattr(obj, spec.version_field, None)

    if expected is None:
        if required:
            raise VersionConflict(
                "this action requires expected_version or an If-Match header",
                {"current_version": current},
            )
        return

    if current is not None and expected != current:
        raise VersionConflict(
            "this record changed since you loaded it",
            {"current_version": current, "supplied_version": expected},
        )


def bump(spec: ResourceSpec, obj: Any) -> int | None:
    """Monotonic version increment, mirrored into the ETag on the way out."""
    if not spec.version_field:
        return None
    current = getattr(obj, spec.version_field, 0) or 0
    setattr(obj, spec.version_field, current + 1)
    return current + 1
