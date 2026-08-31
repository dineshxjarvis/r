"""404 vs 403, decided in one place.

An object outside the caller's authorised scope returns 404, never 403 — a
403 confirms the object exists, which is itself the leak. 403 is reserved for
"this object is visible to you, but this specific act on it is not allowed."

Every handler routes its denial through here so the distinction cannot drift
endpoint by endpoint.
"""

from __future__ import annotations

from app.core.errors import Forbidden, NotFound
from app.kernel.registry import ResourceSpec


def conceal(spec: ResourceSpec, obj_id: str) -> NotFound:
    """Out of scope, or does not exist. Deliberately indistinguishable."""
    return NotFound(
        f"no {spec.object_type} with id {obj_id}",
        {"object": spec.object_type, "id": obj_id},
    )


def refuse(action: str, capability: str, obj_id: str) -> Forbidden:
    """Visible, but this act is not permitted for this principal."""
    return Forbidden(
        f"{action} is not permitted on {obj_id}",
        {"required_capability": capability, "id": obj_id},
    )
