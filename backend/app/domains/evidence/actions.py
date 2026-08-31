"""Evidence actions.

The verdict itself is never mutated. An override is a separate, signed act
recorded on a verification attempt, so the original system judgment survives
for audit — "a manager overrode this" and "the system thought it was fine"
must never become indistinguishable.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.core.errors import Unprocessable
from app.domains.evidence.models import Evidence
from app.integrations.storage import get_storage
from app.kernel.actions import ActionContext, ActionResult, ActionSpec, Effect


class RelinkPayload(BaseModel):
    for_capa_id: str | None = None
    for_instance_id: str | None = None
    for_defect_id: str | None = None


async def evidence_download_url(ctx: ActionContext) -> ActionResult:
    """Short-lived signed GET. The read decision is re-evaluated here rather
    than inherited from whenever the list was fetched."""
    evidence: Evidence = ctx.obj
    storage = get_storage()
    url = await storage.presign_get(bucket=evidence.storage_bucket, key=evidence.storage_key)
    return ActionResult(
        effects=[Effect(object="access_event", change="CREATED")],
        data={"download_url": url, "expires_in": storage.ttl_seconds},
    )


async def evidence_relink(ctx: ActionContext) -> ActionResult:
    """Move a standalone capture onto a target it was not captured for.

    At most one target may be set: evidence captured for a CAPA is not also
    evidence for an obligation period, and letting one row claim both is how
    a single photo ends up closing two unrelated things.
    """
    evidence: Evidence = ctx.obj
    targets = {
        "for_capa_id": ctx.payload.get("for_capa_id"),
        "for_instance_id": ctx.payload.get("for_instance_id"),
        "for_defect_id": ctx.payload.get("for_defect_id"),
    }
    set_targets = [k for k, v in targets.items() if v]
    if len(set_targets) != 1:
        raise Unprocessable(
            "relink sets exactly one target",
            {"supplied": set_targets},
        )

    evidence.for_capa_id = targets["for_capa_id"]
    evidence.for_instance_id = targets["for_instance_id"]
    evidence.for_defect_id = targets["for_defect_id"]
    return ActionResult(effects=[Effect(object="evidence", change="UPDATED", id=evidence.id)])


EVIDENCE_ACTIONS: dict[str, ActionSpec] = {
    "REQUEST_DOWNLOAD_URL": ActionSpec(
        name="REQUEST_DOWNLOAD_URL",
        capability="evidence.read",
        handler=evidence_download_url,
        summary="Get a short-lived signed URL for the captured bytes",
        effects=("access_event.created",),
    ),
    "RELINK_TARGET": ActionSpec(
        name="RELINK_TARGET",
        capability="evidence.relink",
        handler=evidence_relink,
        summary="Attach a standalone capture to a CAPA, instance or defect",
        requires_reason=True,
        requires_version=True,
        payload_model=RelinkPayload,
        effects=("evidence.target",),
    ),
}
