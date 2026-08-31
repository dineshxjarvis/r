"""Introspection: /enums, /schemas, /capabilities.

These three registries are why the field vocabulary can grow without a client
release. A new severity level, document type or statutory form ships as
registry data plus additive fields, and a client that reads labels from here
renders it correctly the day it appears.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.authz.capabilities import capability_report
from app.core.errors import NotFound
from app.kernel.deps import RequestContext, context
from app.kernel.envelope import success
from app.kernel.registry import registry

router = APIRouter()


@router.get("/enums")
async def list_enums(ctx: RequestContext = Depends(context)) -> dict[str, Any]:
    rows = (
        (
            await ctx.session.execute(
                text(
                    """
                SELECT enum_name, COUNT(*) AS value_count
                FROM enum_registry
                GROUP BY enum_name
                ORDER BY enum_name
                """
                )
            )
        )
        .mappings()
        .all()
    )
    return success(
        [{"name": r["enum_name"], "value_count": r["value_count"]} for r in rows],
        request_id=ctx.request_id,
    )


@router.get("/enums/{name}")
async def get_enum(name: str, ctx: RequestContext = Depends(context)) -> dict[str, Any]:
    rows = (
        (
            await ctx.session.execute(
                text(
                    """
                SELECT value, label, label_i18n, ordering, color, deprecated
                FROM enum_registry
                WHERE enum_name = :name
                ORDER BY ordering, value
                """
                ),
                {"name": name},
            )
        )
        .mappings()
        .all()
    )

    if not rows:
        raise NotFound(f"no enum registry named {name!r}", {"enum": name})

    return success(
        {
            "name": name,
            "values": [
                {
                    "value": r["value"],
                    "label": r["label"],
                    "label_i18n": r["label_i18n"],
                    "ordering": r["ordering"],
                    "color": r["color"],
                    "deprecated": r["deprecated"],
                }
                for r in rows
            ],
        },
        request_id=ctx.request_id,
    )


@router.get("/capabilities")
async def get_capabilities(
    resource: str | None = None, ctx: RequestContext = Depends(context)
) -> dict[str, Any]:
    return success(capability_report(ctx.principal, resource=resource), request_id=ctx.request_id)


@router.get("/schemas/{object_type}")
async def get_schema(object_type: str, ctx: RequestContext = Depends(context)) -> dict[str, Any]:
    """A machine description of one resource: its fields, its query grammar,
    and its action vocabulary. Enough to generate a form from."""
    spec = registry.by_object(object_type)
    if spec is None:
        raise NotFound(f"no registered object type {object_type!r}")

    from sqlalchemy import inspect as sa_inspect

    mapper = sa_inspect(spec.model)
    properties = {
        column.key: {"type": _json_type(column.type), "nullable": column.nullable}
        for column in mapper.columns
        if column.key not in spec.hidden_fields
    }

    return success(
        {
            "object": spec.object_type,
            "collection": spec.collection,
            "properties": properties,
            "query": {
                "filterable": sorted(spec.filterable),
                "sortable": sorted(spec.sortable),
                "searchable": list(spec.searchable),
                "expandable": sorted(spec.expandable),
                "aggregatable": sorted(spec.aggregatable),
                "views": sorted(spec.views),
            },
            "write": {
                "creatable": sorted(spec.creatable),
                "required_on_create": sorted(spec.required_on_create),
                "patchable": sorted(spec.patchable),
                "client_generated_ids": spec.client_generated_ids,
            },
            "actions": spec.action_table(),
        },
        request_id=ctx.request_id,
    )


def _json_type(column_type: Any) -> str:
    """Map a column type to its JSON Schema type.

    Some types raise rather than return from `python_type` — a spatial or
    user-defined type has no Python equivalent — so this asks and falls back
    rather than testing for the attribute, which is present either way.
    """
    mapping = {
        str: "string",
        int: "integer",
        float: "number",
        bool: "boolean",
        dict: "object",
        list: "array",
    }
    try:
        return mapping.get(column_type.python_type, "string")
    except (AttributeError, NotImplementedError, TypeError):
        return "string"
