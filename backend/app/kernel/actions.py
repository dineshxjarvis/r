"""ActionSpec and the dispatcher.

Every state transition and command in the system is one row in a resource's
action table, not a route. From a single declaration the kernel derives:
dispatch, `400 UNKNOWN_ACTION` with the allowed set, `409 INVALID_STATE` with
the current state, per-principal `available_actions`, `GET /capabilities`,
`meta.effects`, the audit `transition`, and the bulk path.

Writing an action handler as a branch inside a service is the wrong shape.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Iterable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import InvalidState, UnknownAction, ValidationError

if TYPE_CHECKING:
    from app.authz.principal import Principal
    from app.kernel.registry import ResourceSpec


@dataclass(slots=True)
class Effect:
    """One declared side effect beyond the primary resource.

    Returned live in `meta.effects` so a client invalidates exactly what
    changed instead of refetching the world.
    """

    object: str
    change: str  # "STATE" | "CREATED" | "UPDATED"
    id: str | None = None
    to: str | None = None
    count: int | None = None

    def to_wire(self) -> dict[str, Any]:
        out: dict[str, Any] = {"object": self.object, "change": self.change}
        if self.id is not None:
            out["id"] = self.id
        if self.to is not None:
            out["to"] = self.to
        if self.count is not None:
            out["count"] = self.count
        return out


@dataclass(slots=True)
class ActionContext:
    """Everything an action handler is allowed to see."""

    session: AsyncSession
    spec: ResourceSpec
    obj: Any
    principal: Principal
    payload: dict[str, Any]
    reason: str | None
    effective_at: Any | None
    supporting_authority: dict[str, Any]
    request_id: str


@dataclass(slots=True)
class ActionResult:
    """What an action did. `to_state` drives the audit transition record."""

    to_state: str | None = None
    effects: list[Effect] = field(default_factory=list)
    data: dict[str, Any] = field(default_factory=dict)


Handler = Callable[[ActionContext], Awaitable[ActionResult]]


@dataclass(slots=True)
class ActionSpec:
    """One row of a resource's action table."""

    name: str
    capability: str
    handler: Handler
    summary: str = ""
    # None means "legal in any state"; a frozenset restricts it.
    from_states: frozenset[str] | None = None
    to_state: str | None = None
    requires_reason: bool = False
    requires_version: bool = False
    payload_model: type[BaseModel] | None = None
    effects: tuple[str, ...] = ()

    def legal_in(self, state: str | None) -> bool:
        if self.from_states is None:
            return True
        if state is None:
            return False
        return state in self.from_states

    def to_wire(self) -> dict[str, Any]:
        """The action table as data, for GET /capabilities."""
        return {
            "action": self.name,
            "capability": self.capability,
            "summary": self.summary,
            "from_states": sorted(self.from_states) if self.from_states else None,
            "to_state": self.to_state,
            "requires_reason": self.requires_reason,
            "requires_version": self.requires_version,
            "effects": list(self.effects),
        }


class ActionEnvelope(BaseModel):
    """The request body of every POST /{collection}/{id}/actions."""

    action: str
    payload: dict[str, Any] = {}
    reason: str | None = None
    effective_at: Any | None = None
    expected_version: int | None = None
    supporting_authority: dict[str, Any] = {}
    extensions: dict[str, Any] = {}


class BulkActionEnvelope(BaseModel):
    """POST /{collection}/actions. Authorization is evaluated per target."""

    action: str
    targets: list[str] | None = None
    filter: dict[str, Any] | None = None
    payload: dict[str, Any] = {}
    reason: str | None = None
    atomic: bool = False


def resolve_action(spec: ResourceSpec, name: str, state: str | None) -> ActionSpec:
    """Resolve an action name against a resource's vocabulary and state.

    Unknown -> 400 with the legal set. Known but illegal here -> 409 with the
    current state. The distinction matters: one is a client bug, the other is
    a stale view of a record that moved on.
    """
    action = spec.actions.get(name)
    if action is None:
        raise UnknownAction(
            f"{name!r} is not an action on {spec.object_type}",
            {"allowed": sorted(spec.actions)},
        )
    if not action.legal_in(state):
        allowed = sorted(a.name for a in spec.actions.values() if a.legal_in(state))
        raise InvalidState(
            f"{name} is not legal while {spec.object_type} is {state}",
            {"current_state": state, "allowed": allowed},
        )
    return action


def validate_envelope(action: ActionSpec, envelope: ActionEnvelope) -> dict[str, Any]:
    """Check the envelope's per-action requirements and coerce the payload."""
    errors: list[dict[str, str]] = []

    if action.requires_reason and not (envelope.reason or "").strip():
        errors.append(
            {
                "field": "reason",
                "code": "REASON_REQUIRED",
                "message": f"{action.name} must record why it was done",
            }
        )

    if action.requires_version and envelope.expected_version is None:
        errors.append(
            {
                "field": "expected_version",
                "code": "VERSION_REQUIRED",
                "message": f"{action.name} requires expected_version or If-Match",
            }
        )

    if errors:
        raise ValidationError("action envelope is incomplete", {"errors": errors})

    if action.payload_model is None:
        return envelope.payload
    try:
        return action.payload_model(**envelope.payload).model_dump(exclude_unset=True)
    except Exception as exc:  # pydantic ValidationError
        raise ValidationError(
            f"payload is not valid for {action.name}",
            {"errors": _pydantic_errors(exc)},
        ) from exc


def _pydantic_errors(exc: Exception) -> list[dict[str, str]]:
    """Reshape pydantic's error list into the contract's field-error form.

    Reached through getattr rather than by catching pydantic.ValidationError
    directly, because an action's payload model may be validated by a
    different pydantic version than the one this module imports.
    """
    raw = getattr(exc, "errors", None)
    if not callable(raw):
        return [{"field": "payload", "code": "INVALID", "message": str(exc)}]
    produced = raw()
    if not isinstance(produced, Iterable):
        return [{"field": "payload", "code": "INVALID", "message": str(exc)}]
    out: list[dict[str, str]] = []
    for err in produced:
        loc = ".".join(str(p) for p in err.get("loc", ()))
        out.append(
            {
                "field": f"payload.{loc}" if loc else "payload",
                "code": str(err.get("type", "INVALID")).upper(),
                "message": err.get("msg", "invalid"),
            }
        )
    return out
