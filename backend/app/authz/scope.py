"""Authorized resource sets and the honest reporting of a clipped read.

A cross-scope list never silently returns a short answer. It returns the rows
the caller may see plus a PARTIAL_SCOPE warning naming how much was excluded,
because a silently short list reads as "there is nothing there".
"""

from __future__ import annotations

from typing import Any

from app.authz.principal import Principal


def partial_scope_warning(
    *, requested_mine_ids: list[str] | None, principal: Principal
) -> dict[str, Any] | None:
    """Build the warning when a request asked wider than authority reaches."""
    if principal.authorized_mine_ids is None or not requested_mine_ids:
        return None

    authorized = set(principal.authorized_mine_ids)
    excluded = [m for m in requested_mine_ids if m not in authorized]
    if not excluded:
        return None

    return {
        "code": "PARTIAL_SCOPE",
        "message": f"{len(excluded)} mine(s) excluded from this result",
        "details": {"excluded_count": len(excluded)},
    }


def effective_scope(principal: Principal) -> dict[str, Any]:
    """What the read was actually clipped to. Recorded on metric manifests."""
    return {
        "mine_ids": principal.authorized_mine_ids,
        "tenant_id": principal.tenant_id,
        "unclipped": principal.authorized_mine_ids is None,
    }
