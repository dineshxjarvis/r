"""Action tables for observations, defects, findings and CAPAs.

The pipeline is observation -> defect -> finding -> CAPA, and closure
cascades back up it: the last CAPA on a finding closes the finding, the last
finding on a defect closes the defect. Nothing skips a level.
"""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel
from sqlalchemy import func, select

from app.core.errors import EvidenceInsufficient, Unprocessable
from app.core.ids import new_id
from app.core.time import utcnow
from app.domains.defects.models import Capa, Defect, Finding, Observation
from app.domains.evidence.service import can_close_with
from app.kernel.actions import ActionContext, ActionResult, ActionSpec, Effect

# --------------------------------------------------------------------------
# payload models
# --------------------------------------------------------------------------


class AssignPayload(BaseModel):
    assigned_to: str
    due_on: date | None = None


class ExtendPayload(BaseModel):
    due_on: date


class DecideMatchPayload(BaseModel):
    # Either match an existing defect or declare this a new one. The choice is
    # always a human's — similarity search narrows candidates, it never merges.
    defect_id: str | None = None
    create_new: bool = False


# --------------------------------------------------------------------------
# CAPA
# --------------------------------------------------------------------------


async def capa_assign(ctx: ActionContext) -> ActionResult:
    capa: Capa = ctx.obj
    capa.assigned_to_person_id = ctx.payload["assigned_to"]
    capa.assigned_at = utcnow()
    if ctx.payload.get("due_on"):
        capa.due_on = ctx.payload["due_on"]
    capa.status = "IN_PROGRESS"

    finding = await ctx.session.get(Finding, capa.finding_id)
    effects = [Effect(object="capa", change="STATE", id=capa.id, to="IN_PROGRESS")]
    if finding and finding.status == "OPEN":
        finding.status = "CAPA_ASSIGNED"
        effects.append(Effect(object="finding", change="STATE", id=finding.id, to="CAPA_ASSIGNED"))
    return ActionResult(to_state="IN_PROGRESS", effects=effects)


async def capa_reassign(ctx: ActionContext) -> ActionResult:
    capa: Capa = ctx.obj
    capa.assigned_to_person_id = ctx.payload["assigned_to"]
    capa.assigned_at = utcnow()
    # A reassignment clears any pending submission: the new assignee has not
    # submitted anything, and inheriting someone else's is how accountability
    # gets lost.
    if capa.status == "SUBMITTED":
        capa.status = "IN_PROGRESS"
        capa.submitted_by_person_id = None
        capa.submitted_at = None
    return ActionResult(
        to_state=capa.status,
        effects=[Effect(object="capa", change="STATE", id=capa.id, to=capa.status)],
    )


async def capa_submit(ctx: ActionContext) -> ActionResult:
    capa: Capa = ctx.obj

    from app.domains.evidence.models import Evidence

    linked = (
        await ctx.session.execute(
            select(func.count()).select_from(Evidence).where(Evidence.for_capa_id == capa.id)
        )
    ).scalar_one()
    if not linked:
        raise Unprocessable(
            "a CAPA cannot be submitted without at least one piece of evidence",
            {"rule": "EVIDENCE_REQUIRED", "capa_id": capa.id},
        )

    capa.status = "SUBMITTED"
    capa.submitted_by_person_id = ctx.principal.person_id
    capa.submitted_at = utcnow()

    finding = await ctx.session.get(Finding, capa.finding_id)
    effects = [Effect(object="capa", change="STATE", id=capa.id, to="SUBMITTED")]
    if finding:
        finding.status = "PENDING_VERIFICATION"
        effects.append(
            Effect(
                object="finding",
                change="STATE",
                id=finding.id,
                to="PENDING_VERIFICATION",
            )
        )
    return ActionResult(to_state="SUBMITTED", effects=effects)


async def capa_verify(ctx: ActionContext) -> ActionResult:
    """Accept or reject a submitted CAPA.

    The closure gate runs before anything moves. A blocked gate is a 422 with
    the machine reason and the measured numbers — never a bare "forbidden",
    because the person submitting needs to know what to fix.
    """
    capa: Capa = ctx.obj
    reject = bool(ctx.payload.get("reject"))

    if reject:
        capa.status = "REOPENED"
        capa.rejection_reason = ctx.reason
        capa.submitted_by_person_id = None
        capa.submitted_at = None
        return ActionResult(
            to_state="REOPENED",
            effects=[Effect(object="capa", change="STATE", id=capa.id, to="REOPENED")],
        )

    gate = await can_close_with(
        ctx.session,
        tenant_id=capa.tenant_id,
        attempted_by_person_id=ctx.principal.person_id or "",
        capa_id=capa.id,
        mine_id=capa.mine_id,
        override_by_person_id=(ctx.principal.person_id if ctx.payload.get("override") else None),
        override_reason=ctx.reason if ctx.payload.get("override") else None,
    )

    if not gate.accepted:
        raise EvidenceInsufficient(
            _gate_message(gate.outcome),
            {
                "outcome": gate.outcome,
                "verification_attempt_ids": gate.attempt_ids,
                **gate.detail,
            },
        )

    capa.status = "VERIFIED_CLOSED"
    capa.verified_by_person_id = ctx.principal.person_id
    capa.verified_at = utcnow()

    effects = [
        Effect(object="capa", change="STATE", id=capa.id, to="VERIFIED_CLOSED"),
        Effect(
            object="evidence_verification_attempt",
            change="CREATED",
            count=len(gate.attempt_ids),
        ),
    ]
    effects += await _cascade_closure(ctx, capa)
    return ActionResult(to_state="VERIFIED_CLOSED", effects=effects)


def _gate_message(outcome: str) -> str:
    return {
        "BLOCKED_DISTANCE_MISMATCH": "closure evidence was captured outside the target's geofence",
        "BLOCKED_ALL_UNVERIFIED": (
            "every linked capture is unverifiable; closure needs at least one "
            "verified or plausible one"
        ),
        "BLOCKED_SUSPECT_EVIDENCE": "a linked capture is suspect and no override was supplied",
        "BLOCKED_METADATA_TAMPERED": "a linked capture failed its integrity check",
    }.get(outcome, "closure evidence is insufficient")


async def _cascade_closure(ctx: ActionContext, capa: Capa) -> list[Effect]:
    """A finding closes when its last CAPA closes; a defect when its last
    finding does. Computed rather than assumed — an open sibling keeps the
    parent open."""
    effects: list[Effect] = []

    open_siblings = (
        await ctx.session.execute(
            select(func.count())
            .select_from(Capa)
            .where(Capa.finding_id == capa.finding_id, Capa.status != "VERIFIED_CLOSED")
        )
    ).scalar_one()
    if open_siblings:
        return effects

    finding = await ctx.session.get(Finding, capa.finding_id)
    if finding is None:
        return effects
    finding.status = "CLOSED"
    effects.append(Effect(object="finding", change="STATE", id=finding.id, to="CLOSED"))

    if finding.defect_id is None:
        return effects

    open_findings = (
        await ctx.session.execute(
            select(func.count())
            .select_from(Finding)
            .where(Finding.defect_id == finding.defect_id, Finding.status != "CLOSED")
        )
    ).scalar_one()
    if open_findings:
        return effects

    defect = await ctx.session.get(Defect, finding.defect_id)
    if defect is not None:
        defect.status = "CLOSED"
        effects.append(Effect(object="defect", change="STATE", id=defect.id, to="CLOSED"))
    return effects


async def capa_extend(ctx: ActionContext) -> ActionResult:
    """A deadline extension is a first-class audited act, never a bare edit.
    Repeated extensions are themselves a risk signal, so they are counted."""
    capa: Capa = ctx.obj
    capa.due_on = ctx.payload["due_on"]
    capa.extension_count += 1
    capa.last_extension_reason = ctx.reason
    capa.last_extended_at = utcnow()
    return ActionResult(
        effects=[Effect(object="capa", change="UPDATED", id=capa.id)],
        data={"extension_count": capa.extension_count},
    )


CAPA_ACTIONS: dict[str, ActionSpec] = {
    "ASSIGN": ActionSpec(
        name="ASSIGN",
        capability="capa.assign",
        handler=capa_assign,
        summary="Assign this CAPA to a person and start the clock",
        from_states=frozenset({"OPEN", "REOPENED"}),
        to_state="IN_PROGRESS",
        requires_version=True,
        payload_model=AssignPayload,
        effects=("capa.state", "finding.state", "notification"),
    ),
    "REASSIGN": ActionSpec(
        name="REASSIGN",
        capability="capa.assign",
        handler=capa_reassign,
        summary="Move this CAPA to a different owner",
        from_states=frozenset({"IN_PROGRESS", "SUBMITTED", "REOPENED"}),
        requires_reason=True,
        requires_version=True,
        payload_model=AssignPayload,
        effects=("capa.state", "notification"),
    ),
    "SUBMIT": ActionSpec(
        name="SUBMIT",
        capability="capa.update",
        handler=capa_submit,
        summary="Submit completed work with its evidence for verification",
        from_states=frozenset({"IN_PROGRESS", "REOPENED"}),
        to_state="SUBMITTED",
        requires_version=True,
        effects=("capa.state", "finding.state", "notification"),
    ),
    "VERIFY": ActionSpec(
        name="VERIFY",
        capability="capa.verify",
        handler=capa_verify,
        summary="Accept or reject a submitted CAPA against its evidence",
        from_states=frozenset({"SUBMITTED"}),
        requires_reason=False,
        requires_version=True,
        effects=(
            "capa.state",
            "finding.state",
            "defect.state",
            "evidence_verification_attempt",
        ),
    ),
    "EXTEND_DEADLINE": ActionSpec(
        name="EXTEND_DEADLINE",
        capability="capa.extend_deadline",
        handler=capa_extend,
        summary="Move the due date, recording why",
        from_states=frozenset({"OPEN", "IN_PROGRESS", "SUBMITTED", "REOPENED"}),
        requires_reason=True,
        requires_version=True,
        payload_model=ExtendPayload,
        effects=("capa.due_on",),
    ),
}


# --------------------------------------------------------------------------
# Observation
# --------------------------------------------------------------------------


async def observation_decide_match(ctx: ActionContext) -> ActionResult:
    """Resolve a sighting to a defect: an existing one, or a new one.

    Matching an existing CLOSED defect reopens it as RECURRED and increments
    the counter — `first_observed_on` is never reset, so ageing reads as one
    continuous record for a condition that keeps coming back.
    """
    observation: Observation = ctx.obj
    effects: list[Effect] = []

    defect_id = ctx.payload.get("defect_id")
    if defect_id:
        defect = await ctx.session.get(Defect, defect_id)
        if defect is None:
            raise Unprocessable("no such defect to match against", {"defect_id": defect_id})
        if defect.status == "CLOSED":
            defect.status = "RECURRED"
            defect.recurrence_count += 1
            defect.last_recurred_at = utcnow()
            effects.append(Effect(object="defect", change="STATE", id=defect.id, to="RECURRED"))
        decision = "MATCHED_EXISTING"
    else:
        defect = Defect(
            id=new_id("defect"),
            tenant_id=observation.tenant_id,
            mine_id=observation.mine_id,
            at_subunit_id=observation.at_subunit_id,
            at_asset_id=observation.at_asset_id,
            title=observation.description[:120],
            description=observation.description,
            status="OPEN",
            current_severity=observation.normalised_severity,
            first_observed_on=observation.observed_at.date(),
            recurrence_count=0,
            row_version=1,
            created_at=utcnow(),
            updated_at=utcnow(),
        )
        ctx.session.add(defect)
        await ctx.session.flush()
        effects.append(Effect(object="defect", change="CREATED", id=defect.id))
        decision = "NEW_DEFECT"

    observation.matched_defect_id = defect.id
    observation.match_decision = decision
    observation.match_decision_by_person_id = ctx.principal.person_id
    observation.match_decision_at = utcnow()

    return ActionResult(to_state=decision, effects=effects)


OBSERVATION_ACTIONS: dict[str, ActionSpec] = {
    "DECIDE_MATCH": ActionSpec(
        name="DECIDE_MATCH",
        capability="observation.match",
        handler=observation_decide_match,
        summary="Resolve this sighting to a new or existing defect",
        from_states=frozenset({"PENDING"}),
        requires_version=True,
        payload_model=DecideMatchPayload,
        effects=("defect.created", "defect.state", "observation.match_decision"),
    ),
}


# --------------------------------------------------------------------------
# Finding
# --------------------------------------------------------------------------


async def finding_raise_capa(ctx: ActionContext) -> ActionResult:
    """Open a CAPA against this finding. Both a corrective and a preventive
    action are required — fixing the instance without addressing the cause is
    exactly the pattern the effectiveness signal later catches."""
    finding: Finding = ctx.obj
    capa = Capa(
        id=new_id("capa"),
        tenant_id=finding.tenant_id,
        finding_id=finding.id,
        mine_id=finding.mine_id,
        corrective_action=ctx.payload.get("corrective_action", ""),
        preventive_action=ctx.payload.get("preventive_action", ""),
        status="OPEN",
        extension_count=0,
        row_version=1,
        created_at=utcnow(),
        updated_at=utcnow(),
    )
    if not capa.corrective_action or not capa.preventive_action:
        raise Unprocessable(
            "a CAPA needs both a corrective and a preventive action",
            {"rule": "CORRECTIVE_AND_PREVENTIVE_REQUIRED"},
        )
    ctx.session.add(capa)
    await ctx.session.flush()

    finding.status = "CAPA_ASSIGNED"
    return ActionResult(
        to_state="CAPA_ASSIGNED",
        effects=[
            Effect(object="capa", change="CREATED", id=capa.id),
            Effect(object="finding", change="STATE", id=finding.id, to="CAPA_ASSIGNED"),
        ],
        data={"capa_id": capa.id},
    )


async def finding_reopen(ctx: ActionContext) -> ActionResult:
    finding: Finding = ctx.obj
    finding.status = "REOPENED"
    return ActionResult(
        to_state="REOPENED",
        effects=[Effect(object="finding", change="STATE", id=finding.id, to="REOPENED")],
    )


class RaiseCapaPayload(BaseModel):
    corrective_action: str
    preventive_action: str


FINDING_ACTIONS: dict[str, ActionSpec] = {
    "RAISE_CAPA": ActionSpec(
        name="RAISE_CAPA",
        capability="capa.create",
        handler=finding_raise_capa,
        summary="Open a corrective and preventive action against this finding",
        from_states=frozenset({"OPEN", "REOPENED"}),
        to_state="CAPA_ASSIGNED",
        requires_version=True,
        payload_model=RaiseCapaPayload,
        effects=("capa.created", "finding.state"),
    ),
    "REOPEN": ActionSpec(
        name="REOPEN",
        capability="finding.reopen",
        handler=finding_reopen,
        summary="Reopen a closed finding",
        from_states=frozenset({"CLOSED"}),
        to_state="REOPENED",
        requires_reason=True,
        requires_version=True,
        effects=("finding.state",),
    ),
}


# --------------------------------------------------------------------------
# Defect
# --------------------------------------------------------------------------


async def defect_reclassify(ctx: ActionContext) -> ActionResult:
    defect: Defect = ctx.obj
    defect.current_severity = ctx.payload["severity"]
    return ActionResult(effects=[Effect(object="defect", change="UPDATED", id=defect.id)])


class ReclassifyPayload(BaseModel):
    severity: str


DEFECT_ACTIONS: dict[str, ActionSpec] = {
    "RECLASSIFY_SEVERITY": ActionSpec(
        name="RECLASSIFY_SEVERITY",
        capability="defect.reclassify",
        handler=defect_reclassify,
        summary="Change the severity band, recording why",
        requires_reason=True,
        requires_version=True,
        payload_model=ReclassifyPayload,
        effects=("defect.severity",),
    ),
}
