"""Action tables for extractions, obligation instances and conflicts.

The extraction review queue is where a human decides what an AI proposed.
Nothing auto-publishes regardless of confidence: a wrong obligation is worse
than a missing one, so acceptance is always an explicit act by someone who
can be named in the audit trail.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.core.errors import Unprocessable
from app.core.ids import new_id
from app.core.time import utcnow
from app.domains.documents.models import (
    Extraction,
    Obligation,
    ObligationConflict,
    ObligationInstance,
)
from app.kernel.actions import ActionContext, ActionResult, ActionSpec, Effect


class EditPayload(BaseModel):
    payload: dict = {}
    note: str | None = None


class WaivePayload(BaseModel):
    status_reason: str


class NilReturnPayload(BaseModel):
    statement: str


class ResolveConflictPayload(BaseModel):
    resolution_note: str


# --------------------------------------------------------------------------
# Extraction review
# --------------------------------------------------------------------------


async def _publish_obligation(ctx: ActionContext, extraction: Extraction) -> Obligation:
    """Turn an accepted OBLIGATION extraction into a published obligation.

    The obligation records the document, segment and extraction it came from,
    so a reader can always walk back from a rule to the exact clause that
    created it.
    """
    payload = extraction.payload or {}
    obligation = Obligation(
        id=new_id("obligation"),
        tenant_id=extraction.tenant_id,
        source_document_id=extraction.document_id,
        source_segment_id=extraction.segment_id,
        source_extraction_id=extraction.id,
        shared_obligation_id=payload.get("shared_obligation_id") or new_id("obligation"),
        clause_ref=payload.get("clause_ref", extraction.anchor[:120]),
        deontic=payload.get("deontic", "OBLIGATION"),
        title=payload.get("title", extraction.anchor[:120]),
        summary=payload.get("summary"),
        periodicity=payload.get("periodicity", "ONE_TIME"),
        due_rule_kind=payload.get("due_rule_kind", "UNRESOLVED"),
        due_rule_detail=payload.get("due_rule_detail"),
        grace_period_days=payload.get("grace_period_days", 0),
        source_scope=payload.get("source_scope", "MINE"),
        severity=payload.get("severity", "SIGNIFICANT"),
        nil_permitted=payload.get("nil_permitted", False),
        active=True,
        version_no=1,
        published_at=utcnow(),
        published_by_principal_id=ctx.principal.principal_id,
        row_version=1,
        created_at=utcnow(),
        updated_at=utcnow(),
    )
    ctx.session.add(obligation)
    await ctx.session.flush()
    return obligation


async def extraction_accept(ctx: ActionContext) -> ActionResult:
    extraction: Extraction = ctx.obj
    extraction.status = "ACCEPTED"
    extraction.reviewed_by_person_id = ctx.principal.person_id
    extraction.reviewed_at = utcnow()
    extraction.review_note = ctx.reason

    effects = [Effect(object="extraction", change="STATE", id=extraction.id, to="ACCEPTED")]
    data: dict[str, str] = {}
    if extraction.extraction_type == "OBLIGATION":
        obligation = await _publish_obligation(ctx, extraction)
        effects.append(Effect(object="obligation", change="CREATED", id=obligation.id))
        data["obligation_id"] = obligation.id
    return ActionResult(to_state="ACCEPTED", effects=effects, data=data)


async def extraction_edit(ctx: ActionContext) -> ActionResult:
    """An edited proposal is still a reviewed proposal — the original payload
    stays in the audit trail, so 'the AI said X, the reviewer changed it to Y'
    remains answerable."""
    extraction: Extraction = ctx.obj
    if ctx.payload.get("payload"):
        extraction.payload = {**extraction.payload, **ctx.payload["payload"]}
    extraction.status = "EDITED"
    extraction.reviewed_by_person_id = ctx.principal.person_id
    extraction.reviewed_at = utcnow()
    extraction.review_note = ctx.payload.get("note") or ctx.reason

    effects = [Effect(object="extraction", change="STATE", id=extraction.id, to="EDITED")]
    data: dict[str, str] = {}
    if extraction.extraction_type == "OBLIGATION":
        obligation = await _publish_obligation(ctx, extraction)
        effects.append(Effect(object="obligation", change="CREATED", id=obligation.id))
        data["obligation_id"] = obligation.id
    return ActionResult(to_state="EDITED", effects=effects, data=data)


async def extraction_reject(ctx: ActionContext) -> ActionResult:
    extraction: Extraction = ctx.obj
    extraction.status = "REJECTED"
    extraction.reviewed_by_person_id = ctx.principal.person_id
    extraction.reviewed_at = utcnow()
    extraction.review_note = ctx.reason
    return ActionResult(
        to_state="REJECTED",
        effects=[Effect(object="extraction", change="STATE", id=extraction.id, to="REJECTED")],
    )


EXTRACTION_ACTIONS: dict[str, ActionSpec] = {
    "ACCEPT": ActionSpec(
        name="ACCEPT",
        capability="extraction.review",
        handler=extraction_accept,
        summary="Accept the proposal as written and publish it",
        from_states=frozenset({"PROPOSED"}),
        to_state="ACCEPTED",
        requires_version=True,
        effects=("extraction.state", "obligation.created"),
    ),
    "EDIT": ActionSpec(
        name="EDIT",
        capability="extraction.review",
        handler=extraction_edit,
        summary="Correct the proposal, then publish the corrected version",
        from_states=frozenset({"PROPOSED"}),
        to_state="EDITED",
        requires_version=True,
        payload_model=EditPayload,
        effects=("extraction.state", "obligation.created"),
    ),
    "REJECT": ActionSpec(
        name="REJECT",
        capability="extraction.review",
        handler=extraction_reject,
        summary="Discard the proposal, recording why",
        from_states=frozenset({"PROPOSED"}),
        to_state="REJECTED",
        requires_reason=True,
        requires_version=True,
        effects=("extraction.state",),
    ),
}


# --------------------------------------------------------------------------
# Obligation instance
# --------------------------------------------------------------------------


async def instance_submit(ctx: ActionContext) -> ActionResult:
    instance: ObligationInstance = ctx.obj
    instance.status = "SUBMITTED"
    instance.submitted_by_person_id = ctx.principal.person_id
    instance.submitted_at = utcnow()
    return ActionResult(
        to_state="SUBMITTED",
        effects=[
            Effect(object="obligation_instance", change="STATE", id=instance.id, to="SUBMITTED")
        ],
    )


async def instance_verify(ctx: ActionContext) -> ActionResult:
    """Verification runs the same closure gate as a CAPA — one mechanism, so
    a geofence failure means the same thing on both sides of the system."""
    from app.core.errors import EvidenceInsufficient
    from app.domains.evidence.service import can_close_with

    instance: ObligationInstance = ctx.obj
    gate = await can_close_with(
        ctx.session,
        tenant_id=instance.tenant_id,
        attempted_by_person_id=ctx.principal.person_id or "",
        obligation_instance_id=instance.id,
        mine_id=instance.mine_id,
    )
    if not gate.accepted:
        instance.status = "EVIDENCE_MISMATCH"
        raise EvidenceInsufficient(
            "the evidence linked to this obligation does not satisfy it",
            {"outcome": gate.outcome, **gate.detail},
        )

    instance.status = "SATISFIED"
    instance.verified_by_person_id = ctx.principal.person_id
    instance.verified_at = utcnow()
    return ActionResult(
        to_state="SATISFIED",
        effects=[
            Effect(object="obligation_instance", change="STATE", id=instance.id, to="SATISFIED")
        ],
    )


async def instance_waive(ctx: ActionContext) -> ActionResult:
    instance: ObligationInstance = ctx.obj
    instance.status = "WAIVED"
    instance.status_reason = ctx.payload["status_reason"]
    return ActionResult(
        to_state="WAIVED",
        effects=[Effect(object="obligation_instance", change="STATE", id=instance.id, to="WAIVED")],
    )


async def instance_not_applicable(ctx: ActionContext) -> ActionResult:
    instance: ObligationInstance = ctx.obj
    instance.status = "NOT_APPLICABLE"
    instance.status_reason = ctx.payload["status_reason"]
    return ActionResult(
        to_state="NOT_APPLICABLE",
        effects=[
            Effect(
                object="obligation_instance",
                change="STATE",
                id=instance.id,
                to="NOT_APPLICABLE",
            )
        ],
    )


async def instance_declare_nil(ctx: ActionContext) -> ActionResult:
    """A NIL return is a positive claim that nothing happened, only allowed
    where the obligation itself permits one. It is a record, not an absence —
    which is what makes it contradictable later."""
    instance: ObligationInstance = ctx.obj
    obligation = await ctx.session.get(Obligation, instance.obligation_id)
    if obligation is None or not obligation.nil_permitted:
        raise Unprocessable(
            "this obligation does not permit a NIL return",
            {"obligation_id": instance.obligation_id},
        )

    from sqlalchemy import text

    await ctx.session.execute(
        text(
            """
            INSERT INTO nil_return (
              id, obligation_instance_id, declared_by_person_id, statement, status
            )
            VALUES (:id, :oid, :person, :statement, 'ACTIVE')
            """
        ),
        {
            "id": new_id("nil_return"),
            "oid": instance.id,
            "person": ctx.principal.person_id,
            "statement": ctx.payload["statement"],
        },
    )
    instance.status = "SATISFIED"
    return ActionResult(
        to_state="SATISFIED",
        effects=[
            Effect(object="nil_return", change="CREATED"),
            Effect(object="obligation_instance", change="STATE", id=instance.id, to="SATISFIED"),
        ],
    )


INSTANCE_ACTIONS: dict[str, ActionSpec] = {
    "SUBMIT": ActionSpec(
        name="SUBMIT",
        capability="obligation_instance.submit",
        handler=instance_submit,
        summary="Submit this period's compliance with its evidence",
        from_states=frozenset({"UPCOMING", "DUE", "OVERDUE", "EVIDENCE_MISMATCH"}),
        to_state="SUBMITTED",
        requires_version=True,
        effects=("obligation_instance.state",),
    ),
    "VERIFY": ActionSpec(
        name="VERIFY",
        capability="obligation_instance.verify",
        handler=instance_verify,
        summary="Verify a submission against its evidence",
        from_states=frozenset({"SUBMITTED"}),
        requires_version=True,
        effects=("obligation_instance.state", "evidence_verification_attempt"),
    ),
    "WAIVE": ActionSpec(
        name="WAIVE",
        capability="obligation_instance.waive",
        handler=instance_waive,
        summary="Waive this period, recording the authority for it",
        from_states=frozenset({"UPCOMING", "DUE", "OVERDUE"}),
        to_state="WAIVED",
        requires_reason=True,
        requires_version=True,
        payload_model=WaivePayload,
        effects=("obligation_instance.state",),
    ),
    "MARK_NOT_APPLICABLE": ActionSpec(
        name="MARK_NOT_APPLICABLE",
        capability="obligation_instance.waive",
        handler=instance_not_applicable,
        summary="Declare this obligation inapplicable for this period",
        from_states=frozenset({"UPCOMING", "DUE", "OVERDUE"}),
        to_state="NOT_APPLICABLE",
        requires_reason=True,
        requires_version=True,
        payload_model=WaivePayload,
        effects=("obligation_instance.state",),
    ),
    "DECLARE_NIL": ActionSpec(
        name="DECLARE_NIL",
        capability="obligation_instance.submit",
        handler=instance_declare_nil,
        summary="Declare a NIL return where the obligation permits one",
        from_states=frozenset({"UPCOMING", "DUE", "OVERDUE"}),
        to_state="SATISFIED",
        requires_version=True,
        payload_model=NilReturnPayload,
        effects=("nil_return.created", "obligation_instance.state"),
    ),
}


# --------------------------------------------------------------------------
# Obligation conflict
# --------------------------------------------------------------------------


async def conflict_resolve(ctx: ActionContext) -> ActionResult:
    conflict: ObligationConflict = ctx.obj
    conflict.status = "RESOLVED"
    conflict.resolved_by_person_id = ctx.principal.person_id
    conflict.resolved_at = utcnow()
    conflict.resolution_note = ctx.payload["resolution_note"]
    return ActionResult(
        to_state="RESOLVED",
        effects=[
            Effect(object="obligation_conflict", change="STATE", id=conflict.id, to="RESOLVED")
        ],
    )


async def conflict_accept(ctx: ActionContext) -> ActionResult:
    """Some contradictions are real and intended — two authorities genuinely
    requiring different things. Recording that verdict stops the same conflict
    resurfacing every time the detector runs."""
    conflict: ObligationConflict = ctx.obj
    conflict.status = "ACCEPTED_AS_INTENDED"
    conflict.resolved_by_person_id = ctx.principal.person_id
    conflict.resolved_at = utcnow()
    conflict.resolution_note = ctx.reason
    return ActionResult(
        to_state="ACCEPTED_AS_INTENDED",
        effects=[
            Effect(
                object="obligation_conflict",
                change="STATE",
                id=conflict.id,
                to="ACCEPTED_AS_INTENDED",
            )
        ],
    )


CONFLICT_ACTIONS: dict[str, ActionSpec] = {
    "RESOLVE": ActionSpec(
        name="RESOLVE",
        capability="obligation_conflict.resolve",
        handler=conflict_resolve,
        summary="Record how this contradiction was settled",
        from_states=frozenset({"OPEN"}),
        to_state="RESOLVED",
        requires_version=True,
        payload_model=ResolveConflictPayload,
        effects=("obligation_conflict.state",),
    ),
    "ACCEPT_AS_INTENDED": ActionSpec(
        name="ACCEPT_AS_INTENDED",
        capability="obligation_conflict.resolve",
        handler=conflict_accept,
        summary="Accept that both requirements stand",
        from_states=frozenset({"OPEN"}),
        to_state="ACCEPTED_AS_INTENDED",
        requires_reason=True,
        requires_version=True,
        effects=("obligation_conflict.state",),
    ),
}
