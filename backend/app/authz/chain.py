"""The eight-step authorization chain. Implemented once, used everywhere.

    1. Resolve session -> principal and assurance; failure is 401.
    2. Resolve the target resource and tenant through a trusted lookup.
    3. Resolve the action from the request body; unknown is 400.
    4. Resolve current affiliation, appointment, mandate, jurisdiction facts.
    5. Check(principal, capability_for(action), resource, context).
    6. Assert the action is legal for the resource's current state; else 409.
    7. Apply tenant/authorized-resource filtering and execute.
    8. Persist supporting authority and write audit/access events.

Steps 1 and 4 happen in `principal.py` during request resolution. This module
owns 2, 5, 6 and the denial semantics; the route layer owns 3, 7 and 8.

A handler must never invent its own role check. If a rule is missing, it is
missing here.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.authz.concealment import conceal, refuse
from app.authz.fga import get_fga
from app.authz.policy import (
    check_assurance,
    check_closure_authority,
    check_separation_of_duties,
    severity_category,
)
from app.authz.principal import Principal
from app.core.errors import DependencyUnavailable, StrataError
from app.core.logging import get_logger
from app.kernel.actions import ActionSpec
from app.kernel.registry import ResourceSpec

log = get_logger(__name__)

# Actions whose refusal must also consult the closure policy ladder.
CLOSURE_ACTIONS = frozenset({"VERIFY", "CLOSE", "CLOSE_FINDING", "ISSUE"})


def _fga_object(spec: ResourceSpec, obj: Any) -> str:
    return f"{spec.object_type}:{obj.id}"


def _fga_user(principal: Principal) -> str:
    return f"person:{principal.person_id or principal.principal_id}"


def in_scope(spec: ResourceSpec, obj: Any, principal: Principal) -> bool:
    """Step 2, the scope half: is this record inside the authorized set?

    Failing this is a 404, not a 403 — see concealment.
    """
    if principal.authorized_mine_ids is None:
        return True  # platform/portfolio principal, unclipped by mine
    if spec.mine_field is None:
        return True
    mine_id = getattr(obj, spec.mine_field, None)
    if mine_id is None:
        return True  # tenant-level record; RLS already bounded it
    return mine_id in principal.authorized_mine_ids


async def authorize_read(
    session: AsyncSession,
    spec: ResourceSpec,
    obj: Any,
    principal: Principal,
) -> None:
    """Read authorization. Out of scope conceals; visible-but-denied is 403."""
    if not in_scope(spec, obj, principal):
        raise conceal(spec, obj.id)

    if spec.read_capability and not principal.holds(spec.read_capability):
        # A read capability the principal lacks entirely is treated as
        # concealment too: they should not learn the record exists.
        raise conceal(spec, obj.id)

    fga = get_fga()
    if fga.enabled:
        allowed = await fga.check(
            user=_fga_user(principal),
            relation="viewer",
            obj=_fga_object(spec, obj),
        )
        if not allowed:
            raise conceal(spec, obj.id)


async def authorize_action(
    session: AsyncSession,
    spec: ResourceSpec,
    obj: Any,
    action: ActionSpec,
    principal: Principal,
) -> None:
    """Full chain for a mutation. Order matters and is deliberate.

    Scope first (so a denial conceals rather than confirms), then capability,
    then the graph, then assurance, then the domain policy gates. A record the
    caller cannot see must never produce a 403 about its severity.
    """
    if not in_scope(spec, obj, principal):
        raise conceal(spec, obj.id)

    if action.capability and not principal.holds(action.capability):
        raise refuse(action.name, action.capability, obj.id)

    fga = get_fga()
    if fga.enabled:
        allowed = await fga.check(
            user=_fga_user(principal),
            relation=action.capability.split(".")[-1],
            obj=_fga_object(spec, obj),
        )
        if not allowed:
            raise refuse(action.name, action.capability, obj.id)

    if action.capability:
        await check_assurance(session, principal, action.capability)

    check_separation_of_duties(action.name, obj, principal)

    if action.name in CLOSURE_ACTIONS:
        await check_closure_authority(
            session,
            principal,
            resource_type=spec.object_type,
            category=severity_category(obj),
            issuing_authority_id=getattr(obj, "issuing_authority_id", None),
        )


async def authorize_create(session: AsyncSession, spec: ResourceSpec, principal: Principal) -> None:
    capability = spec.create_capability
    if capability is None:
        raise refuse("CREATE", "", spec.collection)
    if not principal.holds(capability):
        raise refuse("CREATE", capability, spec.collection)
    await check_assurance(session, principal, capability)


async def available_actions(
    session: AsyncSession,
    spec: ResourceSpec,
    obj: Any,
    principal: Principal,
) -> list[str]:
    """The subset of the vocabulary this principal may run on this record now.

    A client renders its controls from this array and never hardcodes a state
    machine. Anything that would raise in `authorize_action` is filtered out
    here, so the two can never disagree.
    """
    if not spec.actions:
        return []

    state = None
    if spec.state_field:
        raw = getattr(obj, spec.state_field, None)
        state = getattr(raw, "value", raw)

    allowed: list[str] = []
    for action in spec.actions.values():
        if not action.legal_in(state):
            continue
        try:
            await authorize_action(session, spec, obj, action, principal)
        except DependencyUnavailable:
            # The graph being down is not a refusal — it is an outage, and
            # reporting an empty action list would read to the client as
            # "you may do nothing here", which is a different claim.
            raise
        except StrataError as exc:
            log.debug(
                "action_filtered",
                action=action.name,
                object=spec.object_type,
                id=obj.id,
                code=exc.code,
            )
            continue
        allowed.append(action.name)
    return allowed
