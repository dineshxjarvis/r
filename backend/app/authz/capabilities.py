"""GET /capabilities — the action vocabulary and this caller's permitted subset.

Derived from the same ActionSpec declarations that drive dispatch, so the
introspection endpoint cannot drift from what the server will actually let
you do.
"""

from __future__ import annotations

from typing import Any

from app.authz.principal import Principal
from app.kernel.registry import ResourceSpec, registry


def capability_report(principal: Principal, *, resource: str | None = None) -> dict[str, Any]:
    specs: list[ResourceSpec]
    if resource:
        spec = registry.get(resource)
        specs = [spec] if spec else []
    else:
        specs = list(registry.all())

    resources: list[dict[str, Any]] = []
    for spec in specs:
        vocabulary = spec.action_table()
        held = [
            row["action"]
            for row in vocabulary
            if not row["capability"] or principal.holds(row["capability"])
        ]
        resources.append(
            {
                "collection": spec.collection,
                "object": spec.object_type,
                "readable": not spec.read_capability or principal.holds(spec.read_capability),
                "creatable": bool(spec.create_capability)
                and principal.holds(spec.create_capability),
                "views": sorted(spec.views),
                "actions": vocabulary,
                # `permitted` is capability-level only. Whether a specific
                # record allows the action right now is `available_actions`
                # on that record, which also evaluates state and policy.
                "permitted": held,
            }
        )

    return {
        "principal": principal.to_wire(),
        "capabilities": sorted(principal.capabilities),
        "resources": resources,
    }
