"""Parse the query grammar. Identical on every collection.

Unknown parameters are a 400, not a silent ignore — silently dropping an
unrecognised param hides client bugs until they reach production.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from app.core.errors import FilterTooDeep, UnknownParameter, ValidationError
from app.kernel.registry import ResourceSpec

FILTER_KEY = re.compile(r"^filter\[([A-Za-z0-9_.]+)\](?:\[([a-z]+)\])?$")
FIELDS_KEY = re.compile(r"^fields\[([A-Za-z0-9_]+)\]$")

OPERATORS = frozenset(
    {
        "eq",
        "ne",
        "lt",
        "lte",
        "gt",
        "gte",
        "in",
        "nin",
        "between",
        "prefix",
        "contains",
        "like",
        "isnull",
        "any",
        "all",
    }
)

RESERVED = frozenset(
    {
        "q",
        "sort",
        "expand",
        "page",
        "limit",
        "cursor",
        "as_of",
        "include_deleted",
        "view",
        "group_by",
        "metrics",
    }
)

MAX_LIMIT = 200
DEFAULT_LIMIT = 20
MAX_EXPAND_PATHS = 5
MAX_EXPAND_DEPTH = 3


@dataclass(slots=True)
class Filter:
    field: str
    op: str
    value: Any
    relation: str | None = None


@dataclass(slots=True)
class QuerySpec:
    filters: list[Filter] = field(default_factory=list)
    q: str | None = None
    sort: list[tuple[str, bool]] = field(default_factory=list)  # (field, descending)
    fields: dict[str, set[str]] = field(default_factory=dict)
    expand: list[str] = field(default_factory=list)
    page: int = 1
    limit: int = DEFAULT_LIMIT
    cursor: str | None = None
    as_of: datetime | None = None
    include_deleted: bool = False
    view: str | None = None
    group_by: list[str] = field(default_factory=list)
    metrics: list[str] = field(default_factory=list)

    @property
    def is_aggregate(self) -> bool:
        return bool(self.group_by or self.metrics)


def parse(params: dict[str, list[str]], spec: ResourceSpec) -> QuerySpec:
    """Turn raw query params into a validated QuerySpec for one resource."""
    out = QuerySpec(limit=DEFAULT_LIMIT)

    for key, values in params.items():
        raw = values[-1] if values else ""

        match = FILTER_KEY.match(key)
        if match:
            out.filters.append(_parse_filter(match, raw, spec))
            continue

        match = FIELDS_KEY.match(key)
        if match:
            out.fields[match.group(1)] = {f.strip() for f in raw.split(",") if f.strip()}
            continue

        if key not in RESERVED:
            raise UnknownParameter(
                f"{key!r} is not a recognised parameter",
                {"parameter": key, "allowed": sorted(RESERVED)},
            )

        _apply_reserved(out, key, raw, spec)

    if out.view is not None:
        spec.view(out.view)  # raises UNKNOWN_VIEW with the allowed set

    return out


def _parse_filter(match: re.Match[str], raw: str, spec: ResourceSpec) -> Filter:
    path = match.group(1)
    op = match.group(2) or "eq"

    if op not in OPERATORS:
        raise ValidationError(
            f"{op!r} is not a filter operator",
            {"allowed": sorted(OPERATORS)},
        )

    relation: str | None = None
    field_name = path
    if "." in path:
        parts = path.split(".")
        if len(parts) > 2:
            raise FilterTooDeep(
                "relation filters are limited to one hop",
                {"filter": path},
            )
        relation, field_name = parts

    filterable = spec.filterable
    check = path if relation else field_name
    if check not in filterable:
        raise UnknownParameter(
            f"{check!r} is not filterable on {spec.collection}",
            {"allowed": sorted(filterable)},
        )

    return Filter(field=field_name, op=op, value=_coerce(op, raw), relation=relation)


def _coerce(op: str, raw: str) -> Any:
    if op in {"in", "nin", "between"}:
        return [v.strip() for v in raw.split(",") if v.strip()]
    if op == "isnull":
        return raw.lower() in {"true", "1", "yes"}
    # A comma inside a plain equality means OR within that one field.
    if op == "eq" and "," in raw:
        return [v.strip() for v in raw.split(",") if v.strip()]
    return raw


def _apply_reserved(out: QuerySpec, key: str, raw: str, spec: ResourceSpec) -> None:
    if key == "q":
        out.q = raw or None

    elif key == "sort":
        for token in (t.strip() for t in raw.split(",")):
            if not token:
                continue
            descending = token.startswith("-")
            name = token.lstrip("-+")
            if name not in spec.sortable:
                raise UnknownParameter(
                    f"{name!r} is not sortable on {spec.collection}",
                    {"allowed": sorted(spec.sortable)},
                )
            out.sort.append((name, descending))

    elif key == "expand":
        paths = [p.strip() for p in raw.split(",") if p.strip()]
        if len(paths) > MAX_EXPAND_PATHS:
            raise ValidationError(
                f"at most {MAX_EXPAND_PATHS} expand paths",
                {"requested": len(paths)},
            )
        for path in paths:
            if path.count(".") + 1 > MAX_EXPAND_DEPTH:
                raise ValidationError(
                    f"expand depth is limited to {MAX_EXPAND_DEPTH}",
                    {"path": path},
                )
            root = path.split(".")[0]
            if root not in spec.expandable and root != "available_actions":
                raise UnknownParameter(
                    f"{root!r} is not expandable on {spec.collection}",
                    {"allowed": sorted(spec.expandable)},
                )
        out.expand = paths

    elif key == "page":
        out.page = max(1, _int(raw, 1, "page"))

    elif key == "limit":
        out.limit = min(MAX_LIMIT, max(1, _int(raw, DEFAULT_LIMIT, "limit")))

    elif key == "cursor":
        out.cursor = raw or None

    elif key == "as_of":
        out.as_of = _datetime(raw)

    elif key == "include_deleted":
        out.include_deleted = raw.lower() in {"true", "1", "yes"}

    elif key == "view":
        out.view = raw or None

    elif key == "group_by":
        for name in (n.strip() for n in raw.split(",")):
            if not name:
                continue
            if name not in spec.aggregatable:
                raise UnknownParameter(
                    f"{name!r} is not groupable on {spec.collection}",
                    {"allowed": sorted(spec.aggregatable)},
                )
            out.group_by.append(name)

    elif key == "metrics":
        out.metrics = [m.strip() for m in raw.split(",") if m.strip()]


def _int(raw: str, default: int, name: str) -> int:
    try:
        return int(raw)
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{name} must be an integer", {"field": name, "value": raw}) from exc


def _datetime(raw: str) -> datetime:
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValidationError(
            "as_of must be an RFC 3339 instant",
            {"field": "as_of", "value": raw},
        ) from exc
