"""Notification actions. Acknowledgement is a receipt, never an approval."""

from __future__ import annotations

from app.core.time import utcnow
from app.domains.workflow.models import Notification
from app.kernel.actions import ActionContext, ActionResult, ActionSpec, Effect


async def notification_acknowledge(ctx: ActionContext) -> ActionResult:
    notification: Notification = ctx.obj
    notification.status = "ACKNOWLEDGED"
    notification.acknowledged_at = utcnow()
    return ActionResult(
        to_state="ACKNOWLEDGED",
        effects=[
            Effect(object="notification", change="STATE", id=notification.id, to="ACKNOWLEDGED")
        ],
    )


async def notification_mark_actioned(ctx: ActionContext) -> ActionResult:
    """Marking a notification actioned says the recipient dealt with the
    subject elsewhere. It changes nothing about the subject itself — the
    domain record has its own lifecycle and its own authorization."""
    notification: Notification = ctx.obj
    notification.status = "ACTIONED"
    notification.actioned_at = utcnow()
    return ActionResult(
        to_state="ACTIONED",
        effects=[Effect(object="notification", change="STATE", id=notification.id, to="ACTIONED")],
    )


NOTIFICATION_ACTIONS: dict[str, ActionSpec] = {
    "ACKNOWLEDGE": ActionSpec(
        name="ACKNOWLEDGE",
        capability="notification.read",
        handler=notification_acknowledge,
        summary="Confirm receipt",
        from_states=frozenset({"QUEUED", "SENT", "DELIVERED"}),
        to_state="ACKNOWLEDGED",
        effects=("notification.state",),
    ),
    "MARK_ACTIONED": ActionSpec(
        name="MARK_ACTIONED",
        capability="notification.read",
        handler=notification_mark_actioned,
        summary="Record that the underlying work was dealt with",
        from_states=frozenset({"DELIVERED", "ACKNOWLEDGED"}),
        to_state="ACTIONED",
        effects=("notification.state",),
    ),
}
