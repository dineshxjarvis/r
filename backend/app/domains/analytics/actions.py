"""Signal actions.

A signal cannot execute a domain decision. Reviewing one records what a human
made of it and, optionally, which domain record they acted on — a declared
link, never inferred causality. Dismissal is a state, so a signal someone
waved away stays auditable.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.core.ids import new_id
from app.core.time import utcnow
from app.domains.analytics.models import SignalInstance, SignalReview
from app.kernel.actions import ActionContext, ActionResult, ActionSpec, Effect


class ReviewPayload(BaseModel):
    disposition: str  # CONFIRMED_USEFUL | ACTED_ON | NOT_USEFUL | INCORRECT | DUPLICATE
    domain_link_type: str | None = None
    domain_link_id: str | None = None


def _record_review(ctx: ActionContext, disposition: str) -> SignalReview:
    supporting = ctx.supporting_authority or {}
    return SignalReview(
        id=new_id("signal_review"),
        signal_instance_id=ctx.obj.id,
        reviewer_person_id=ctx.principal.person_id or "",
        reviewer_appointment_id=supporting.get("appointment_id"),
        disposition=disposition,
        reason=ctx.reason,
        domain_link_type=ctx.payload.get("domain_link_type"),
        domain_link_id=ctx.payload.get("domain_link_id"),
        reviewed_at=utcnow(),
    )


async def signal_review(ctx: ActionContext) -> ActionResult:
    signal: SignalInstance = ctx.obj
    disposition = ctx.payload["disposition"]
    ctx.session.add(_record_review(ctx, disposition))

    signal.state = "RESOLVED" if disposition in {"ACTED_ON", "CONFIRMED_USEFUL"} else "ACKNOWLEDGED"
    return ActionResult(
        to_state=signal.state,
        effects=[
            Effect(object="signal_review", change="CREATED"),
            Effect(object="signal", change="STATE", id=signal.id, to=signal.state),
        ],
    )


async def signal_dismiss(ctx: ActionContext) -> ActionResult:
    """Dismissal is feedback, not deletion — the reason is what tells whoever
    tunes the definition later whether the signal was wrong or just noisy."""
    signal: SignalInstance = ctx.obj
    ctx.session.add(_record_review(ctx, "NOT_USEFUL"))
    signal.state = "DISMISSED"
    return ActionResult(
        to_state="DISMISSED",
        effects=[
            Effect(object="signal_review", change="CREATED"),
            Effect(object="signal", change="STATE", id=signal.id, to="DISMISSED"),
        ],
    )


async def signal_acknowledge(ctx: ActionContext) -> ActionResult:
    signal: SignalInstance = ctx.obj
    signal.state = "ACKNOWLEDGED"
    return ActionResult(
        to_state="ACKNOWLEDGED",
        effects=[Effect(object="signal", change="STATE", id=signal.id, to="ACKNOWLEDGED")],
    )


SIGNAL_ACTIONS: dict[str, ActionSpec] = {
    "ACKNOWLEDGE": ActionSpec(
        name="ACKNOWLEDGE",
        capability="signal.review",
        handler=signal_acknowledge,
        summary="Mark this signal seen",
        from_states=frozenset({"ACTIVE"}),
        to_state="ACKNOWLEDGED",
        requires_version=True,
        effects=("signal.state",),
    ),
    "REVIEW": ActionSpec(
        name="REVIEW",
        capability="signal.review",
        handler=signal_review,
        summary="Record what this signal turned out to be worth",
        from_states=frozenset({"ACTIVE", "ACKNOWLEDGED"}),
        requires_version=True,
        payload_model=ReviewPayload,
        effects=("signal_review.created", "signal.state"),
    ),
    "DISMISS": ActionSpec(
        name="DISMISS",
        capability="signal.review",
        handler=signal_dismiss,
        summary="Dismiss this signal, recording why it was not useful",
        from_states=frozenset({"ACTIVE", "ACKNOWLEDGED"}),
        to_state="DISMISSED",
        requires_reason=True,
        requires_version=True,
        effects=("signal_review.created", "signal.state"),
    ),
}
