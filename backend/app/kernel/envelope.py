"""The universal resource envelope and the success/error response envelopes.

Built here once. A handler never hand-rolls a response body — if a field is
missing from a payload somewhere, it is missing from this file, not from one
endpoint.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import inspect as sa_inspect

from app.core.time import isoformat, utcnow
from app.kernel.registry import ResourceSpec
from app.kernel.scalars import scalar_out


def resource_envelope(
    spec: ResourceSpec,
    obj: Any,
    *,
    available_actions: list[str] | None = None,
    fields: set[str] | None = None,
) -> dict[str, Any]:
    """One resource, header first, then domain fields.

    `available_actions` is omitted rather than sent empty when it was not
    computed — an empty array means "this principal may do nothing here",
    which is a different statement from "nobody asked".
    """
    if spec.serialize is not None:
        body = spec.serialize(obj)
    else:
        body = _default_serialize(spec, obj)

    header: dict[str, Any] = {
        "id": obj.id,
        "object": spec.object_type,
    }

    if spec.version_field and hasattr(obj, spec.version_field):
        header["version"] = getattr(obj, spec.version_field)
    if spec.tenant_field and hasattr(obj, spec.tenant_field):
        header["tenant_id"] = getattr(obj, spec.tenant_field)
    if spec.state_field and hasattr(obj, spec.state_field):
        header["state"] = _enum_value(getattr(obj, spec.state_field))
    if available_actions is not None:
        header["available_actions"] = available_actions

    for ts in ("created_at", "updated_at"):
        if hasattr(obj, ts):
            header[ts] = isoformat(getattr(obj, ts))

    header["extensions"] = {}
    header["links"] = {"self": f"/api/v1/{spec.collection}/{obj.id}"}

    merged = {**header, **{k: v for k, v in body.items() if k not in header}}

    if fields:
        keep = fields | {"id", "object"}
        merged = {k: v for k, v in merged.items() if k in keep}
    return merged


def _default_serialize(spec: ResourceSpec, obj: Any) -> dict[str, Any]:
    """Every mapped column except the ones the spec hides."""
    mapper = sa_inspect(type(obj))
    skip = spec.hidden_fields | {"id", "created_at", "updated_at"}
    if spec.tenant_field:
        skip = skip | {spec.tenant_field}
    if spec.version_field:
        skip = skip | {spec.version_field}

    out: dict[str, Any] = {}
    for column in mapper.columns:
        name = column.key
        if name in skip:
            continue
        out[name] = scalar_out(_enum_value(getattr(obj, name, None)))
    return out


def _enum_value(value: Any) -> Any:
    """Native PG enums arrive as str already; python Enums are unwrapped."""
    return getattr(value, "value", value)


def success(
    data: Any,
    *,
    request_id: str,
    message: str | None = None,
    pagination: dict[str, Any] | None = None,
    included: dict[str, Any] | None = None,
    warnings: list[dict[str, Any]] | None = None,
    meta_extra: dict[str, Any] | None = None,
    as_of: str | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {"success": True}
    if message:
        body["message"] = message
    body["data"] = data
    if included:
        body["included"] = included
    if pagination is not None:
        body["pagination"] = pagination
    # `warnings` is how a partial-authorization read stays honest: the caller
    # gets the rows they may see plus an explicit note that scope was clipped,
    # rather than a silently short list.
    body["warnings"] = warnings or []
    meta: dict[str, Any] = {
        "request_id": request_id,
        "served_at": isoformat(utcnow()),
        "as_of": as_of,
        "deprecations": [],
    }
    if meta_extra:
        meta.update(meta_extra)
    body["meta"] = meta
    return body


def failure(
    code: str,
    message: str,
    *,
    request_id: str,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "success": False,
        "message": message,
        "error": {"code": code, "details": details or {}},
        "meta": {"request_id": request_id, "served_at": isoformat(utcnow())},
    }


def etag_for(obj: Any, spec: ResourceSpec) -> str | None:
    """Weak ETag mirroring the envelope's version. Supply either, not both."""
    if not spec.version_field:
        return None
    version = getattr(obj, spec.version_field, None)
    if version is None:
        return None
    return f'W/"{obj.id}:{version}"'
