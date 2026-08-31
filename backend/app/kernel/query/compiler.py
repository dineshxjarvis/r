"""Compile a QuerySpec into SQL. The only place a query string becomes a query.

Every filter, sort and aggregate the API accepts is built here against fields
the resource declared. Nothing undeclared reaches SQL, so this layer is also
the injection boundary.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import Select, and_, false, func, or_, select
from sqlalchemy.orm import InstrumentedAttribute

from app.core.errors import UnknownParameter, ValidationError
from app.kernel.query.parser import Filter, QuerySpec
from app.kernel.registry import ResourceSpec

AGGREGATES = {"count", "sum", "avg", "min", "max"}


def base_select(spec: ResourceSpec) -> Select[Any]:
    return select(spec.model)


def apply_filters(stmt: Select[Any], spec: ResourceSpec, query: QuerySpec) -> Select[Any]:
    for flt in query.filters:
        if flt.relation:
            # One hop. Resolved as a correlated EXISTS against the related
            # collection rather than a join, so the row count stays honest
            # when the relation is one-to-many.
            stmt = _apply_relation_filter(stmt, spec, flt)
        else:
            stmt = stmt.where(_predicate(_column(spec, flt.field), flt))
    return stmt


def _column(spec: ResourceSpec, name: str) -> InstrumentedAttribute[Any]:
    column = getattr(spec.model, name, None)
    if column is None:
        raise UnknownParameter(
            f"{name!r} is not a field on {spec.collection}",
            {"field": name},
        )
    return column


def _apply_relation_filter(stmt: Select[Any], spec: ResourceSpec, flt: Filter) -> Select[Any]:
    expansion = spec.expandable.get(flt.relation or "")
    if expansion is None:
        raise UnknownParameter(
            f"{flt.relation!r} is not a relation on {spec.collection}",
            {"allowed": sorted(spec.expandable)},
        )
    from app.kernel.registry import registry

    target = registry.get(expansion.target_collection)
    if target is None:
        raise UnknownParameter(f"{expansion.target_collection} is not registered")

    local = _column(spec, expansion.local_field)
    remote_id = target.model.id
    remote_field = getattr(target.model, flt.field, None)
    if remote_field is None:
        raise UnknownParameter(f"{flt.field!r} is not a field on {expansion.target_collection}")
    sub = select(remote_id).where(and_(remote_id == local, _predicate(remote_field, flt)))
    return stmt.where(sub.exists())


def _coerce(column: Any, value: Any, field: str) -> Any:
    """Cast a query-string value to the column's own Python type.

    Everything arrives from HTTP as text, and PostgreSQL will not compare an
    integer or a date against a varchar parameter — it refuses rather than
    guessing. This is the layer that knows the column types, so the cast
    belongs here rather than in the parser.
    """
    if value is None or isinstance(value, bool):
        return value
    if isinstance(value, list):
        return [_coerce(column, v, field) for v in value]

    try:
        python_type = column.type.python_type
    except (AttributeError, NotImplementedError):
        return value

    if python_type is str or isinstance(value, python_type):
        return value

    try:
        if python_type is bool:
            return str(value).lower() in {"true", "1", "yes"}
        if python_type is int:
            return int(value)
        if python_type is float:
            return float(value)
        if python_type is Decimal:
            return Decimal(str(value))
        if python_type is datetime:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if python_type is date:
            return date.fromisoformat(str(value))
    except (TypeError, ValueError) as exc:
        raise ValidationError(
            f"{value!r} is not a valid value for {field}",
            {"field": field, "expected": python_type.__name__},
        ) from exc

    return value


def _predicate(column: Any, flt: Filter) -> Any:
    value = _coerce(column, flt.value, flt.field)
    op = flt.op

    if op == "eq":
        # A list here came from comma-separated values: OR within one field.
        return column.in_(value) if isinstance(value, list) else column == value
    if op == "ne":
        return column != value
    if op == "lt":
        return column < value
    if op == "lte":
        return column <= value
    if op == "gt":
        return column > value
    if op == "gte":
        return column >= value
    if op == "in":
        return column.in_(value)
    if op == "nin":
        return column.notin_(value)
    if op == "between":
        if not isinstance(value, list) or len(value) != 2:
            raise ValidationError(
                "between takes exactly two comma-separated bounds",
                {"field": flt.field},
            )
        return column.between(value[0], value[1])
    if op == "prefix":
        return column.ilike(f"{value}%")
    if op in {"contains", "like"}:
        return column.ilike(f"%{value}%")
    if op == "isnull":
        return column.is_(None) if flt.value else column.isnot(None)
    if op == "any":
        return column.overlap(value if isinstance(value, list) else [value])
    if op == "all":
        return column.contains(value if isinstance(value, list) else [value])

    raise ValidationError(f"unsupported operator {op!r}", {"field": flt.field})


def apply_search(stmt: Select[Any], spec: ResourceSpec, query: QuerySpec) -> Select[Any]:
    if not query.q or not spec.searchable:
        return stmt
    term = f"%{query.q}%"
    clauses = [getattr(spec.model, name).ilike(term) for name in spec.searchable]
    return stmt.where(or_(*clauses))


def apply_sort(stmt: Select[Any], spec: ResourceSpec, query: QuerySpec) -> Select[Any]:
    pairs = query.sort
    if not pairs:
        name = spec.default_sort.lstrip("-")
        descending = spec.default_sort.startswith("-")
        pairs = [(name, descending)]

    for name, descending in pairs:
        column = getattr(spec.model, name, None)
        if column is None:
            continue
        stmt = stmt.order_by(column.desc() if descending else column.asc())

    # Stable tiebreak: without it, two rows with the same sort key can swap
    # between pages and a client sees one twice and another never.
    return stmt.order_by(spec.model.id.asc())


def apply_scope(
    stmt: Select[Any], spec: ResourceSpec, *, mine_ids: list[str] | None
) -> Select[Any]:
    """Clip to the caller's authorized resource set.

    RLS already restricts to the tenant; this narrows further to the mines
    the principal actually holds authority over. Both run — the database
    constraint is defence in depth, not the policy.
    """
    if mine_ids is None or spec.mine_field is None:
        return stmt
    column = getattr(spec.model, spec.mine_field, None)
    if column is None:
        return stmt
    if not mine_ids:
        # An empty authorized set returns nothing, not everything. This is the
        # difference between "you may see no mines" and a missing WHERE clause.
        return stmt.where(false())
    return stmt.where(column.in_(mine_ids))


def apply_soft_delete(stmt: Select[Any], spec: ResourceSpec, query: QuerySpec) -> Select[Any]:
    if query.include_deleted:
        return stmt
    for name in ("deleted_at", "superseded_by_id"):
        column = getattr(spec.model, name, None)
        if column is not None:
            stmt = stmt.where(column.is_(None))
    return stmt


def count_select(stmt: Select[Any]) -> Select[Any]:
    return select(func.count()).select_from(stmt.order_by(None).subquery())


def build_aggregate(spec: ResourceSpec, query: QuerySpec, stmt: Select[Any]) -> Select[Any]:
    """`group_by` + `metrics` turn any collection into an aggregate.

    This is what replaces every per-domain summary and counts route.
    """
    group_columns = [getattr(spec.model, name) for name in query.group_by]
    selected: list[Any] = list(group_columns)

    for metric in query.metrics:
        selected.append(_metric_expression(spec, metric))

    inner = stmt.order_by(None).subquery()
    remapped_groups = [inner.c[name] for name in query.group_by]
    remapped_metrics = [_metric_expression_on(inner, metric) for metric in query.metrics]

    agg = select(*remapped_groups, *remapped_metrics)
    if remapped_groups:
        agg = agg.group_by(*remapped_groups)
    return agg


def _metric_expression(spec: ResourceSpec, metric: str) -> Any:
    name, _, arg = metric.partition("(")
    arg = arg.rstrip(")")
    if name not in AGGREGATES:
        raise ValidationError(
            f"{name!r} is not a supported metric",
            {"allowed": sorted(AGGREGATES)},
        )
    if name == "count":
        return func.count().label("count")
    column = getattr(spec.model, arg, None)
    if column is None:
        raise UnknownParameter(f"{arg!r} is not a field on {spec.collection}")
    return getattr(func, name)(column).label(metric)


def _metric_expression_on(subquery: Any, metric: str) -> Any:
    name, _, arg = metric.partition("(")
    arg = arg.rstrip(")").split(".")[0]
    if name == "count":
        return func.count().label("count")
    return getattr(func, name)(subquery.c[arg]).label(metric)


def compile_list(
    spec: ResourceSpec,
    query: QuerySpec,
    *,
    mine_ids: list[str] | None = None,
) -> Select[Any]:
    """The full read pipeline for a collection."""
    stmt = base_select(spec)
    if query.view:
        stmt = spec.view(query.view).apply(stmt)
    stmt = apply_scope(stmt, spec, mine_ids=mine_ids)
    stmt = apply_soft_delete(stmt, spec, query)
    stmt = apply_filters(stmt, spec, query)
    stmt = apply_search(stmt, spec, query)
    if not query.is_aggregate:
        stmt = apply_sort(stmt, spec, query)
    return stmt
