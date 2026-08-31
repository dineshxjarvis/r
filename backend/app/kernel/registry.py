"""The resource registry. Nothing is routable until it is registered here.

One `ResourceSpec` per collection declares what the kernel needs to serve the
seven route forms over it: which model, which fields are filterable /
sortable / searchable / expandable, which named views exist, and which
actions make up its vocabulary. The route layer is generic; this is where a
domain says what it is.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import Select

from app.core.errors import UnknownView
from app.core.ids import PREFIXES
from app.kernel.actions import ActionSpec


@dataclass(slots=True)
class Expansion:
    """One `?expand=` path: how to load it and what object type comes back."""

    target_object: str
    local_field: str
    target_collection: str
    # None -> resolved by primary key on the target collection
    label_field: str | None = None


@dataclass(slots=True)
class ViewSpec:
    """A named server-side projection: a saved filter+sort+field set.

    `apply` receives the base select and returns a narrowed one. A view never
    switches to a different security boundary — it is a projection, not a
    second write model.
    """

    name: str
    summary: str
    apply: Callable[[Select[Any]], Select[Any]]
    fields: tuple[str, ...] | None = None


@dataclass(slots=True)
class ResourceSpec:
    collection: str
    object_type: str
    model: type[Any]

    read_capability: str
    create_capability: str | None = None

    state_field: str | None = None
    tenant_field: str | None = "tenant_id"
    version_field: str | None = "row_version"
    mine_field: str | None = "mine_id"

    filterable: frozenset[str] = frozenset()
    sortable: frozenset[str] = frozenset()
    searchable: tuple[str, ...] = ()
    aggregatable: frozenset[str] = frozenset()
    patchable: frozenset[str] = frozenset()
    creatable: frozenset[str] = frozenset()
    required_on_create: frozenset[str] = frozenset()

    expandable: dict[str, Expansion] = field(default_factory=dict)
    views: dict[str, ViewSpec] = field(default_factory=dict)
    actions: dict[str, ActionSpec] = field(default_factory=dict)

    default_sort: str = "-created_at"
    # Cursor pagination only for genuinely live-appended streams, where a
    # page number against a moving list is meaningless.
    cursor_paginated: bool = False
    # Client-generated IDs (offline capture). The server never reassigns them.
    client_generated_ids: bool = False

    serialize: Callable[[Any], dict[str, Any]] | None = None
    hidden_fields: frozenset[str] = frozenset()

    def view(self, name: str) -> ViewSpec:
        spec = self.views.get(name)
        if spec is None:
            raise UnknownView(
                f"{name!r} is not a view on {self.collection}",
                {"allowed": sorted(self.views)},
            )
        return spec

    def action_table(self) -> list[dict[str, Any]]:
        return [a.to_wire() for a in self.actions.values()]


class Registry:
    """Every registered collection, keyed by path segment."""

    def __init__(self) -> None:
        self._by_collection: dict[str, ResourceSpec] = {}
        self._by_object: dict[str, ResourceSpec] = {}

    def register(self, spec: ResourceSpec) -> ResourceSpec:
        if spec.collection in self._by_collection:
            raise RuntimeError(f"collection {spec.collection!r} already registered")
        if spec.object_type not in PREFIXES:
            raise RuntimeError(
                f"object type {spec.object_type!r} has no ID prefix — add one "
                "to app.core.ids.PREFIXES before registering it"
            )
        self._by_collection[spec.collection] = spec
        self._by_object[spec.object_type] = spec
        return spec

    def get(self, collection: str) -> ResourceSpec | None:
        return self._by_collection.get(collection)

    def by_object(self, object_type: str) -> ResourceSpec | None:
        return self._by_object.get(object_type)

    def collections(self) -> Sequence[str]:
        return sorted(self._by_collection)

    def all(self) -> Sequence[ResourceSpec]:
        return [self._by_collection[c] for c in sorted(self._by_collection)]

    def __contains__(self, collection: str) -> bool:
        return collection in self._by_collection


registry = Registry()
