"""Action tables for inspections, visits and assignment members.

Assignment is offered and accepted, never assumed. Fieldwork cannot start
until the mandatory roles are actually filled by people who said yes — a
team roster is a claim about who will be there, and an inspection that starts
without one produces a report nobody stands behind.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import func, select

from app.core.errors import Unprocessable
from app.core.ids import new_id
from app.core.time import utcnow
from app.domains.inspections.models import (
    Inspection,
    InspectionAssignmentMember,
    InspectionAssignmentVersion,
    InspectionDecision,
    InspectionVisit,
)
from app.kernel.actions import ActionContext, ActionResult, ActionSpec, Effect


class RespondPayload(BaseModel):
    accept: bool
    reason: str | None = None


class PostponePayload(BaseModel):
    planned_from: datetime
    planned_until: datetime


def _decision(
    ctx: ActionContext, inspection_id: str, decision_type: str, outcome: str
) -> InspectionDecision:
    """Every lifecycle decision leaves an append-only record naming the
    principal and the appointment that authorised it."""
    supporting = ctx.supporting_authority or {}
    return InspectionDecision(
        id=new_id("inspection_decision"),
        inspection_id=inspection_id,
        decision_type=decision_type,
        outcome=outcome,
        decided_by_principal_id=ctx.principal.principal_id,
        supporting_appointment_id=supporting.get("appointment_id"),
        supporting_mandate_assignment_id=supporting.get("mandate_assignment_id"),
        reason=ctx.reason,
        decided_at=utcnow(),
    )


# --------------------------------------------------------------------------
# Assignment member
# --------------------------------------------------------------------------


async def member_respond(ctx: ActionContext) -> ActionResult:
    """Accept or decline a place on an inspection team.

    A decline needs a reason: an unexplained gap in a statutory team is the
    thing a later enquiry asks about first.
    """
    member: InspectionAssignmentMember = ctx.obj
    accept = bool(ctx.payload.get("accept"))

    if not accept and not (ctx.payload.get("reason") or ctx.reason):
        raise Unprocessable(
            "declining a team place requires a reason",
            {"rule": "DECLINE_REASON_REQUIRED"},
        )

    now = utcnow()
    member.responded_at = now
    member.response_reason = ctx.payload.get("reason") or ctx.reason
    if accept:
        member.assignment_status = "ACCEPTED"
        member.accepted_at = now
    else:
        member.assignment_status = "DECLINED"

    return ActionResult(
        to_state=member.assignment_status,
        effects=[
            Effect(
                object="inspection_assignment_member",
                change="STATE",
                id=member.id,
                to=member.assignment_status,
            )
        ],
    )


async def member_withdraw(ctx: ActionContext) -> ActionResult:
    """A withdrawal leaves the inspection unstartable until a valid team
    version is active again — the gap is made visible rather than papered
    over by silently promoting whoever is left."""
    member: InspectionAssignmentMember = ctx.obj
    member.assignment_status = "WITHDRAWN"
    member.withdrawn_at = utcnow()
    member.response_reason = ctx.reason
    return ActionResult(
        to_state="WITHDRAWN",
        effects=[
            Effect(
                object="inspection_assignment_member",
                change="STATE",
                id=member.id,
                to="WITHDRAWN",
            )
        ],
    )


MEMBER_ACTIONS: dict[str, ActionSpec] = {
    "RESPOND": ActionSpec(
        name="RESPOND",
        capability="inspection.respond_assignment",
        handler=member_respond,
        summary="Accept or decline this team place",
        from_states=frozenset({"OFFERED"}),
        requires_version=True,
        payload_model=RespondPayload,
        effects=("inspection_assignment_member.state",),
    ),
    "WITHDRAW": ActionSpec(
        name="WITHDRAW",
        capability="inspection.respond_assignment",
        handler=member_withdraw,
        summary="Step down from an accepted place",
        from_states=frozenset({"ACCEPTED"}),
        requires_reason=True,
        requires_version=True,
        effects=("inspection_assignment_member.state",),
    ),
}


# --------------------------------------------------------------------------
# Inspection
# --------------------------------------------------------------------------


async def _accepted_member_count(ctx: ActionContext, inspection_id: str) -> int:
    active_version = (
        await ctx.session.execute(
            select(InspectionAssignmentVersion.id).where(
                InspectionAssignmentVersion.inspection_id == inspection_id,
                InspectionAssignmentVersion.status == "ACTIVE",
            )
        )
    ).scalar_one_or_none()
    if active_version is None:
        return 0
    return (
        await ctx.session.execute(
            select(func.count())
            .select_from(InspectionAssignmentMember)
            .where(
                InspectionAssignmentMember.assignment_version_id == active_version,
                InspectionAssignmentMember.assignment_status == "ACCEPTED",
            )
        )
    ).scalar_one()


async def inspection_start(ctx: ActionContext) -> ActionResult:
    inspection: Inspection = ctx.obj

    accepted = await _accepted_member_count(ctx, inspection.id)
    if accepted == 0:
        raise Unprocessable(
            "an inspection cannot start with nobody who has accepted a place",
            {"rule": "TEAM_COVERAGE_REQUIRED", "accepted_members": 0},
        )

    inspection.status = "IN_PROGRESS"
    inspection.started_at = utcnow()
    ctx.session.add(_decision(ctx, inspection.id, "START", "STARTED"))
    return ActionResult(
        to_state="IN_PROGRESS",
        effects=[
            Effect(object="inspection", change="STATE", id=inspection.id, to="IN_PROGRESS"),
            Effect(object="inspection_decision", change="CREATED"),
        ],
    )


async def inspection_complete_fieldwork(ctx: ActionContext) -> ActionResult:
    inspection: Inspection = ctx.obj

    open_visits = (
        await ctx.session.execute(
            select(func.count())
            .select_from(InspectionVisit)
            .where(
                InspectionVisit.inspection_id == inspection.id,
                InspectionVisit.status.notin_(["COMPLETED", "CANCELLED"]),
            )
        )
    ).scalar_one()
    if open_visits:
        raise Unprocessable(
            "fieldwork is not complete while visits are still open",
            {"open_visits": open_visits},
        )

    inspection.status = "FIELDWORK_COMPLETE"
    inspection.fieldwork_completed_at = utcnow()
    return ActionResult(
        to_state="FIELDWORK_COMPLETE",
        effects=[
            Effect(
                object="inspection",
                change="STATE",
                id=inspection.id,
                to="FIELDWORK_COMPLETE",
            )
        ],
    )


async def inspection_close(ctx: ActionContext) -> ActionResult:
    """Closing an inspection never closes its findings.

    The two lifecycles are independent by design: an inspection is finished
    when its report is issued, a finding when its CAPA is verified. Collapsing
    them would let an inspector close their own findings by closing the visit.
    """
    inspection: Inspection = ctx.obj
    inspection.status = "CLOSED"
    inspection.closed_at = utcnow()
    ctx.session.add(_decision(ctx, inspection.id, "CLOSURE", "CLOSED"))
    return ActionResult(
        to_state="CLOSED",
        effects=[
            Effect(object="inspection", change="STATE", id=inspection.id, to="CLOSED"),
            Effect(object="inspection_decision", change="CREATED"),
        ],
    )


async def inspection_cancel(ctx: ActionContext) -> ActionResult:
    inspection: Inspection = ctx.obj
    inspection.status = "CANCELLED"
    ctx.session.add(_decision(ctx, inspection.id, "CANCELLATION", "CANCELLED"))
    return ActionResult(
        to_state="CANCELLED",
        effects=[
            Effect(object="inspection", change="STATE", id=inspection.id, to="CANCELLED"),
            Effect(object="inspection_decision", change="CREATED"),
        ],
    )


INSPECTION_ACTIONS: dict[str, ActionSpec] = {
    "START": ActionSpec(
        name="START",
        capability="inspection.conduct",
        handler=inspection_start,
        summary="Begin fieldwork once the team is in place",
        from_states=frozenset({"PLANNED", "ASSIGNED"}),
        to_state="IN_PROGRESS",
        requires_version=True,
        effects=("inspection.state", "inspection_decision.created"),
    ),
    "COMPLETE_FIELDWORK": ActionSpec(
        name="COMPLETE_FIELDWORK",
        capability="inspection.conduct",
        handler=inspection_complete_fieldwork,
        summary="Mark fieldwork finished across every visit",
        from_states=frozenset({"IN_PROGRESS"}),
        to_state="FIELDWORK_COMPLETE",
        requires_version=True,
        effects=("inspection.state",),
    ),
    "CLOSE": ActionSpec(
        name="CLOSE",
        capability="inspection.close",
        handler=inspection_close,
        summary="Close the inspection after its report is issued",
        from_states=frozenset({"ISSUED", "REPORT_PENDING"}),
        to_state="CLOSED",
        requires_reason=True,
        requires_version=True,
        effects=("inspection.state", "inspection_decision.created"),
    ),
    "CANCEL": ActionSpec(
        name="CANCEL",
        capability="inspection.plan",
        handler=inspection_cancel,
        summary="Cancel a planned inspection; recorded work is retained",
        from_states=frozenset({"DRAFT", "PLANNED", "ASSIGNED", "IN_PROGRESS"}),
        to_state="CANCELLED",
        requires_reason=True,
        requires_version=True,
        effects=("inspection.state", "inspection_decision.created"),
    ),
}


# --------------------------------------------------------------------------
# Visit
# --------------------------------------------------------------------------


async def visit_start(ctx: ActionContext) -> ActionResult:
    visit: InspectionVisit = ctx.obj
    visit.status = "IN_PROGRESS"
    visit.actual_started_at = utcnow()
    return ActionResult(
        to_state="IN_PROGRESS",
        effects=[Effect(object="inspection_visit", change="STATE", id=visit.id, to="IN_PROGRESS")],
    )


async def visit_complete(ctx: ActionContext) -> ActionResult:
    visit: InspectionVisit = ctx.obj
    visit.status = "COMPLETED"
    visit.actual_ended_at = utcnow()
    return ActionResult(
        to_state="COMPLETED",
        effects=[Effect(object="inspection_visit", change="STATE", id=visit.id, to="COMPLETED")],
    )


async def visit_postpone(ctx: ActionContext) -> ActionResult:
    """The original window is retained. A postponed visit that reads as if it
    were always scheduled for the later date hides the delay."""
    visit: InspectionVisit = ctx.obj
    visit.status = "POSTPONED"
    visit.postponement_reason = ctx.reason
    visit.planned_from = ctx.payload["planned_from"]
    visit.planned_until = ctx.payload["planned_until"]
    return ActionResult(
        to_state="POSTPONED",
        effects=[Effect(object="inspection_visit", change="STATE", id=visit.id, to="POSTPONED")],
    )


VISIT_ACTIONS: dict[str, ActionSpec] = {
    "START": ActionSpec(
        name="START",
        capability="inspection.conduct",
        handler=visit_start,
        summary="Start this visit",
        from_states=frozenset({"PLANNED", "POSTPONED"}),
        to_state="IN_PROGRESS",
        requires_version=True,
        effects=("inspection_visit.state",),
    ),
    "COMPLETE": ActionSpec(
        name="COMPLETE",
        capability="inspection.conduct",
        handler=visit_complete,
        summary="Finish this visit",
        from_states=frozenset({"IN_PROGRESS"}),
        to_state="COMPLETED",
        requires_version=True,
        effects=("inspection_visit.state",),
    ),
    "POSTPONE": ActionSpec(
        name="POSTPONE",
        capability="inspection.plan",
        handler=visit_postpone,
        summary="Move this visit to a new window, keeping the original",
        from_states=frozenset({"PLANNED", "IN_PROGRESS"}),
        to_state="POSTPONED",
        requires_reason=True,
        requires_version=True,
        payload_model=PostponePayload,
        effects=("inspection_visit.state",),
    ),
}
