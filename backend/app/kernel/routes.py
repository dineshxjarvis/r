"""The seven route forms, generic over every registered resource.

    GET    /{collection}                    read many
    GET    /{collection}/{id}               read one
    POST   /{collection}                    create one
    PATCH  /{collection}/{id}               attribute correction
    POST   /{collection}/{id}/actions       every state transition
    POST   /{collection}/actions            the same, in bulk
    GET    /{collection}/{id}/history       the change record

Adding a capability adds a row to an action table, not a route to this file.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.event import read_history, write_audit_event
from app.authz.chain import (
    authorize_action,
    authorize_create,
    authorize_read,
    available_actions,
)
from app.authz.scope import partial_scope_warning
from app.core.errors import NotFound, StrataError, ValidationError
from app.core.ids import new_id
from app.core.time import utcnow
from app.kernel import idempotency
from app.kernel.actions import (
    ActionContext,
    ActionEnvelope,
    BulkActionEnvelope,
    resolve_action,
    validate_envelope,
)
from app.kernel.concurrency import bump, check_version
from app.kernel.deps import RequestContext, context
from app.kernel.envelope import etag_for, resource_envelope, success
from app.kernel.query import compiler, parser
from app.kernel.query.pagination import (
    COUNT_CEILING,
    cursor_envelope,
    decode_cursor,
    encode_cursor,
    offset_for,
    page_envelope,
)
from app.kernel.registry import ResourceSpec, registry
from app.outbox.writer import write_outbox

router = APIRouter()

MAX_BULK_TARGETS = 1000


def query_params(request: Request) -> dict[str, list[str]]:
    """Group repeated query params by key.

    Repetition is meaningful in this grammar — `filter[status]` twice means
    two ANDed conditions — so the raw multi-items have to be preserved rather
    than collapsed by dict(request.query_params).
    """
    grouped: dict[str, list[str]] = {}
    for key, value in request.query_params.multi_items():
        grouped.setdefault(key, []).append(value)
    return grouped


def _spec_or_404(collection: str) -> ResourceSpec:
    spec = registry.get(collection)
    if spec is None:
        raise NotFound(f"no collection {collection!r}", {"collection": collection})
    return spec


async def _load(session: AsyncSession, spec: ResourceSpec, obj_id: str) -> Any:
    obj = await session.get(spec.model, obj_id)
    if obj is None:
        # Indistinguishable from "not yours" on purpose.
        raise NotFound(
            f"no {spec.object_type} with id {obj_id}",
            {"object": spec.object_type, "id": obj_id},
        )
    return obj


def _state_of(spec: ResourceSpec, obj: Any) -> str | None:
    if not spec.state_field:
        return None
    raw = getattr(obj, spec.state_field, None)
    return getattr(raw, "value", raw)


# ---------------------------------------------------------------------------
# Read many
# ---------------------------------------------------------------------------


@router.get("/{collection}")
async def list_resources(
    collection: str,
    request: Request,
    ctx: RequestContext = Depends(context),
) -> dict[str, Any]:
    spec = _spec_or_404(collection)
    query = parser.parse(query_params(request), spec)

    stmt = compiler.compile_list(spec, query, mine_ids=ctx.principal.authorized_mine_ids)

    if query.is_aggregate:
        agg = compiler.build_aggregate(spec, query, stmt)
        rows = (await ctx.session.execute(agg)).mappings().all()
        data = [
            {
                "key": {k: r[k] for k in query.group_by},
                "metrics": {k: r[k] for k in r.keys() if k not in query.group_by},
            }
            for r in rows
        ]
        return success(data, request_id=ctx.request_id)

    warnings = []
    scope_warning = partial_scope_warning(
        requested_mine_ids=[
            f.value for f in query.filters if f.field == "mine_id" and isinstance(f.value, str)
        ],
        principal=ctx.principal,
    )
    if scope_warning:
        warnings.append(scope_warning)

    if spec.cursor_paginated and (query.cursor or not query.sort):
        return await _cursor_page(ctx, spec, query, stmt, warnings)

    total: int | None = (await ctx.session.execute(compiler.count_select(stmt))).scalar_one()
    if total is not None and total > COUNT_CEILING:
        total = None

    rows = (
        (
            await ctx.session.execute(
                stmt.limit(query.limit).offset(offset_for(query.page, query.limit))
            )
        )
        .scalars()
        .all()
    )

    fields = query.fields.get(spec.object_type)
    data = [resource_envelope(spec, obj, fields=fields) for obj in rows]

    return success(
        data,
        request_id=ctx.request_id,
        pagination=page_envelope(page=query.page, limit=query.limit, total=total),
        warnings=warnings,
        as_of=query.as_of.isoformat() if query.as_of else None,
    )


async def _cursor_page(
    ctx: RequestContext,
    spec: ResourceSpec,
    query: Any,
    stmt: Any,
    warnings: list[dict[str, Any]],
) -> dict[str, Any]:
    """Live-appended streams. Keyset on id, which is ULID and so time-ordered."""
    if query.cursor:
        payload = decode_cursor(query.cursor)
        last_id = payload.get("id")
        if last_id:
            stmt = stmt.where(spec.model.id < last_id)

    rows = (await ctx.session.execute(stmt.limit(query.limit + 1))).scalars().all()
    has_more = len(rows) > query.limit
    rows = rows[: query.limit]

    next_cursor = encode_cursor({"id": rows[-1].id}) if has_more and rows else None
    data = [resource_envelope(spec, obj) for obj in rows]
    return success(
        data,
        request_id=ctx.request_id,
        pagination=cursor_envelope(next_cursor=next_cursor),
        warnings=warnings,
    )


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("/{collection}", status_code=201)
async def create_resource(
    collection: str,
    body: dict[str, Any],
    response: Response,
    ctx: RequestContext = Depends(context),
) -> dict[str, Any]:
    spec = _spec_or_404(collection)
    route = f"POST /{collection}"

    key = idempotency.require_key(ctx.idempotency_key, route)
    replayed = await idempotency.replay(
        ctx.session,
        principal_id=ctx.principal.principal_id,
        route=route,
        target="",
        key=key,
        request_body=body,
    )
    if replayed:
        response.headers["Idempotency-Replayed"] = "true"
        return replayed["body"]

    await authorize_create(ctx.session, spec, ctx.principal)
    await idempotency.reserve(
        ctx.session,
        principal_id=ctx.principal.principal_id,
        route=route,
        target="",
        key=key,
        request_body=body,
    )

    missing = spec.required_on_create - set(body)
    if missing:
        raise ValidationError(
            "required fields are missing",
            {
                "errors": [
                    {"field": f, "code": "REQUIRED", "message": "is required"}
                    for f in sorted(missing)
                ]
            },
        )

    values = {k: v for k, v in body.items() if k in spec.creatable}

    # Offline-capture collections let the client own the ID so a retried sync
    # is a no-op. Everything else gets a server-generated one.
    obj_id = body.get("id") if spec.client_generated_ids else None
    now = utcnow()

    obj = spec.model(
        id=obj_id or new_id(spec.object_type),
        **values,
    )
    if spec.tenant_field and hasattr(obj, spec.tenant_field):
        setattr(obj, spec.tenant_field, ctx.principal.tenant_id)
    if spec.version_field and hasattr(obj, spec.version_field):
        setattr(obj, spec.version_field, 1)
    for stamp in ("created_at", "updated_at"):
        if hasattr(obj, stamp) and getattr(obj, stamp, None) is None:
            setattr(obj, stamp, now)

    ctx.session.add(obj)
    await ctx.session.flush()

    audit_id = await write_audit_event(
        ctx.session,
        tenant_id=ctx.principal.tenant_id,
        action=f"{spec.object_type}.created",
        object_type=spec.object_type,
        object_id=obj.id,
        actor_principal_id=ctx.principal.principal_id,
        actor_person_id=ctx.principal.person_id,
        after=values,
        request_id=ctx.request_id,
    )
    await write_outbox(
        ctx.session,
        tenant_id=ctx.principal.tenant_id,
        aggregate_type=spec.object_type,
        aggregate_id=obj.id,
        event_type=f"{spec.object_type}.created",
        payload={"id": obj.id, **{k: str(v) for k, v in values.items()}},
        audit_event_id=audit_id,
    )

    actions = await available_actions(ctx.session, spec, obj, ctx.principal)
    body_out = success(
        resource_envelope(spec, obj, available_actions=actions),
        request_id=ctx.request_id,
    )
    await idempotency.record(
        ctx.session,
        principal_id=ctx.principal.principal_id,
        route=route,
        target="",
        key=key,
        status=201,
        response_body=body_out,
    )

    response.headers["Location"] = f"/api/v1/{collection}/{obj.id}"
    etag = etag_for(obj, spec)
    if etag:
        response.headers["ETag"] = etag
    return body_out


# ---------------------------------------------------------------------------
# Bulk actions — registered before /{id} so "actions" is not read as an id
# ---------------------------------------------------------------------------


@router.post("/{collection}/actions")
async def bulk_action(
    collection: str,
    envelope: BulkActionEnvelope,
    response: Response,
    ctx: RequestContext = Depends(context),
) -> dict[str, Any]:
    """Authorization is evaluated per target. A bulk call is never a scope
    escalation — it is a loop with one round trip, nothing more."""
    spec = _spec_or_404(collection)
    idempotency.require_key(ctx.idempotency_key, f"POST /{collection}/actions")

    target_ids = envelope.targets or []
    if envelope.filter and not target_ids:
        stmt = compiler.base_select(spec)
        stmt = compiler.apply_scope(stmt, spec, mine_ids=ctx.principal.authorized_mine_ids)
        for field, value in envelope.filter.items():
            column = getattr(spec.model, field, None)
            if column is not None:
                stmt = stmt.where(column == value)
        target_ids = [
            row.id for row in (await ctx.session.execute(stmt.limit(MAX_BULK_TARGETS))).scalars()
        ]

    if len(target_ids) > MAX_BULK_TARGETS:
        raise ValidationError(
            f"a bulk action resolves at most {MAX_BULK_TARGETS} targets",
            {"resolved": len(target_ids)},
        )

    results: list[dict[str, Any]] = []
    succeeded = 0

    for target_id in target_ids:
        single = ActionEnvelope(
            action=envelope.action, payload=envelope.payload, reason=envelope.reason
        )
        try:
            outcome = await _run_action(ctx, spec, target_id, single, enforce_version=False)
            results.append(
                {
                    "id": target_id,
                    "status": 200,
                    "version": outcome["version"],
                    "state": outcome["state"],
                }
            )
            succeeded += 1
        except StrataError as exc:
            if envelope.atomic:
                raise
            results.append(
                {
                    "id": target_id,
                    "status": exc.status_code,
                    "error": {"code": exc.code, "message": exc.message},
                }
            )

    response.status_code = 200 if envelope.atomic else 207
    return success(
        {
            "requested": len(target_ids),
            "succeeded": succeeded,
            "failed": len(target_ids) - succeeded,
            "results": results,
        },
        request_id=ctx.request_id,
    )


# ---------------------------------------------------------------------------
# Read one
# ---------------------------------------------------------------------------


@router.get("/{collection}/{obj_id}")
async def get_resource(
    collection: str,
    obj_id: str,
    request: Request,
    response: Response,
    ctx: RequestContext = Depends(context),
) -> dict[str, Any]:
    spec = _spec_or_404(collection)
    obj = await _load(ctx.session, spec, obj_id)
    await authorize_read(ctx.session, spec, obj, ctx.principal)

    query = parser.parse(query_params(request), spec)
    actions = await available_actions(ctx.session, spec, obj, ctx.principal)

    etag = etag_for(obj, spec)
    if etag:
        response.headers["ETag"] = etag

    included = await _expand(ctx.session, spec, obj, query.expand)
    return success(
        resource_envelope(
            spec, obj, available_actions=actions, fields=query.fields.get(spec.object_type)
        ),
        request_id=ctx.request_id,
        included=included or None,
    )


async def _expand(
    session: AsyncSession, spec: ResourceSpec, obj: Any, paths: list[str]
) -> dict[str, Any]:
    """Resolve `?expand=` paths into `included`, keyed by "<object>:<id>".

    Shared parents transfer once rather than per row, which is the whole
    point of a side-loaded map over inline nesting.
    """
    included: dict[str, Any] = {}
    for path in paths:
        root = path.split(".")[0]
        expansion = spec.expandable.get(root)
        if expansion is None:
            continue
        target_spec = registry.get(expansion.target_collection)
        if target_spec is None:
            continue
        target_id = getattr(obj, expansion.local_field, None)
        if not target_id:
            continue
        target = await session.get(target_spec.model, target_id)
        if target is not None:
            included[f"{target_spec.object_type}:{target.id}"] = resource_envelope(
                target_spec, target
            )
    return included


# ---------------------------------------------------------------------------
# Attribute correction
# ---------------------------------------------------------------------------


@router.patch("/{collection}/{obj_id}")
async def patch_resource(
    collection: str,
    obj_id: str,
    body: dict[str, Any],
    response: Response,
    ctx: RequestContext = Depends(context),
) -> dict[str, Any]:
    """Free-field correction, only where the domain permits one at all.

    A field with a lifecycle is not patchable — moving a CAPA to CLOSED is an
    action with a capability and a state precondition, not an attribute edit.
    """
    spec = _spec_or_404(collection)
    if not spec.patchable:
        raise ValidationError(
            f"{spec.collection} does not permit attribute correction; use an action",
            {"allowed_actions": sorted(spec.actions)},
        )

    obj = await _load(ctx.session, spec, obj_id)
    await authorize_read(ctx.session, spec, obj, ctx.principal)

    unknown = set(body) - spec.patchable - {"expected_version"}
    if unknown:
        raise ValidationError(
            "these fields are not correctable",
            {"fields": sorted(unknown), "allowed": sorted(spec.patchable)},
        )

    check_version(
        spec,
        obj,
        expected_version=body.get("expected_version"),
        if_match=ctx.if_match,
        required=False,
    )

    before = {k: getattr(obj, k, None) for k in body if k in spec.patchable}
    for field, value in body.items():
        if field in spec.patchable:
            setattr(obj, field, value)
    version = bump(spec, obj)

    audit_id = await write_audit_event(
        ctx.session,
        tenant_id=getattr(obj, spec.tenant_field or "", None),
        action=f"{spec.object_type}.corrected",
        object_type=spec.object_type,
        object_id=obj.id,
        actor_principal_id=ctx.principal.principal_id,
        actor_person_id=ctx.principal.person_id,
        changes=[
            {"field": k, "from": str(before.get(k)), "to": str(v)}
            for k, v in body.items()
            if k in spec.patchable
        ],
        request_id=ctx.request_id,
    )
    await write_outbox(
        ctx.session,
        tenant_id=getattr(obj, spec.tenant_field or "", None),
        aggregate_type=spec.object_type,
        aggregate_id=obj.id,
        event_type=f"{spec.object_type}.corrected",
        payload={"id": obj.id, "fields": sorted(before)},
        audit_event_id=audit_id,
    )

    if version is not None:
        response.headers["ETag"] = f'W/"{obj.id}:{version}"'
    actions = await available_actions(ctx.session, spec, obj, ctx.principal)
    return success(
        resource_envelope(spec, obj, available_actions=actions), request_id=ctx.request_id
    )


# ---------------------------------------------------------------------------
# Actions
# ---------------------------------------------------------------------------


@router.post("/{collection}/{obj_id}/actions")
async def run_action(
    collection: str,
    obj_id: str,
    envelope: ActionEnvelope,
    response: Response,
    ctx: RequestContext = Depends(context),
) -> dict[str, Any]:
    spec = _spec_or_404(collection)
    route = f"POST /{collection}/{{id}}/actions"

    key = idempotency.require_key(ctx.idempotency_key, route)
    replayed = await idempotency.replay(
        ctx.session,
        principal_id=ctx.principal.principal_id,
        route=route,
        target=obj_id,
        key=key,
        request_body=envelope.model_dump(),
    )
    if replayed:
        response.headers["Idempotency-Replayed"] = "true"
        return replayed["body"]

    await idempotency.reserve(
        ctx.session,
        principal_id=ctx.principal.principal_id,
        route=route,
        target=obj_id,
        key=key,
        request_body=envelope.model_dump(),
    )

    outcome = await _run_action(ctx, spec, obj_id, envelope, enforce_version=True)
    body_out = outcome["body"]

    await idempotency.record(
        ctx.session,
        principal_id=ctx.principal.principal_id,
        route=route,
        target=obj_id,
        key=key,
        status=200,
        response_body=body_out,
    )
    if outcome["version"] is not None:
        response.headers["ETag"] = f'W/"{obj_id}:{outcome["version"]}"'
    return body_out


async def _run_action(
    ctx: RequestContext,
    spec: ResourceSpec,
    obj_id: str,
    envelope: ActionEnvelope,
    *,
    enforce_version: bool,
) -> dict[str, Any]:
    """One action, start to finish, including its three atomic writes."""
    obj = await _load(ctx.session, spec, obj_id)

    state_before = _state_of(spec, obj)
    action = resolve_action(spec, envelope.action, state_before)
    payload = validate_envelope(action, envelope)

    await authorize_action(ctx.session, spec, obj, action, ctx.principal)

    check_version(
        spec,
        obj,
        expected_version=envelope.expected_version,
        if_match=ctx.if_match,
        required=enforce_version and action.requires_version,
    )

    result = await action.handler(
        ActionContext(
            session=ctx.session,
            spec=spec,
            obj=obj,
            principal=ctx.principal,
            payload=payload,
            reason=envelope.reason,
            effective_at=envelope.effective_at,
            supporting_authority=envelope.supporting_authority,
            request_id=ctx.request_id,
        )
    )

    version = bump(spec, obj)
    state_after = _state_of(spec, obj)
    tenant_id = getattr(obj, spec.tenant_field or "", None) or ctx.principal.tenant_id

    audit_id = await write_audit_event(
        ctx.session,
        tenant_id=tenant_id,
        action=f"{spec.object_type}.{action.name}",
        object_type=spec.object_type,
        object_id=obj.id,
        actor_principal_id=ctx.principal.principal_id,
        actor_person_id=ctx.principal.person_id,
        acting_appointment_id=(envelope.supporting_authority or {}).get("appointment_id"),
        acting_mandate_assignment_id=(envelope.supporting_authority or {}).get(
            "mandate_assignment_id"
        ),
        transition_from=state_before,
        transition_to=state_after,
        reason=envelope.reason,
        request_id=ctx.request_id,
        effective_at=envelope.effective_at,
    )
    await write_outbox(
        ctx.session,
        tenant_id=tenant_id,
        aggregate_type=spec.object_type,
        aggregate_id=obj.id,
        event_type=f"{spec.object_type}.{action.name.lower()}",
        payload={
            "id": obj.id,
            "action": action.name,
            "from": state_before,
            "to": state_after,
            **result.data,
        },
        audit_event_id=audit_id,
    )

    await ctx.session.flush()
    actions_now = await available_actions(ctx.session, spec, obj, ctx.principal)

    effects = [e.to_wire() for e in result.effects]
    effects.append({"object": "audit_event", "id": audit_id, "change": "CREATED"})

    body_out = success(
        resource_envelope(spec, obj, available_actions=actions_now),
        request_id=ctx.request_id,
        meta_extra={
            "action": action.name,
            "transition": {"from": state_before, "to": state_after},
            "effects": effects,
        },
    )
    return {"body": body_out, "version": version, "state": state_after}


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------


@router.get("/{collection}/{obj_id}/history")
async def get_history(
    collection: str,
    obj_id: str,
    page: int = 1,
    limit: int = 50,
    ctx: RequestContext = Depends(context),
) -> dict[str, Any]:
    spec = _spec_or_404(collection)
    obj = await _load(ctx.session, spec, obj_id)
    await authorize_read(ctx.session, spec, obj, ctx.principal)

    limit = min(200, max(1, limit))
    events = await read_history(
        ctx.session,
        object_type=spec.object_type,
        object_id=obj_id,
        limit=limit,
        offset=offset_for(page, limit),
    )
    return success(
        events,
        request_id=ctx.request_id,
        pagination=page_envelope(page=page, limit=limit, total=None),
    )
