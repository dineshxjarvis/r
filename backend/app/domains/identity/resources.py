"""Registered collections for the identity domain."""

from __future__ import annotations

from app.domains.identity.models import Asset, Mine, Person, Subunit
from app.kernel.registry import Expansion, ResourceSpec, registry

MINES = registry.register(
    ResourceSpec(
        collection="mines",
        object_type="mine",
        model=Mine,
        read_capability="mine.read_internal",
        create_capability="mine.configure",
        state_field="status",
        mine_field="id",  # a mine scopes itself
        filterable=frozenset(
            {"code", "name", "mine_type", "gassiness_class", "status", "state_code", "tenant_id"}
        ),
        sortable=frozenset({"name", "code", "created_at", "production_scale_tpa"}),
        searchable=("name", "code", "lease_ref"),
        aggregatable=frozenset({"mine_type", "status", "gassiness_class", "state_code"}),
        patchable=frozenset({"name", "headcount", "production_scale_tpa", "lease_ref"}),
        creatable=frozenset(
            {"code", "name", "mine_type", "gassiness_class", "state_code", "tenant_id"}
        ),
        required_on_create=frozenset({"code", "name", "mine_type"}),
        default_sort="name",
    )
)

SUBUNITS = registry.register(
    ResourceSpec(
        collection="subunits",
        object_type="subunit",
        model=Subunit,
        read_capability="mine.read_internal",
        create_capability="mine.configure",
        state_field="status",
        filterable=frozenset({"mine_id", "code", "subunit_kind", "status"}),
        sortable=frozenset({"name", "code", "created_at"}),
        searchable=("name", "code"),
        expandable={
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            )
        },
        default_sort="name",
    )
)

ASSETS = registry.register(
    ResourceSpec(
        collection="assets",
        object_type="asset",
        model=Asset,
        read_capability="mine.read_internal",
        create_capability="mine.configure",
        state_field="status",
        filterable=frozenset({"mine_id", "subunit_id", "asset_kind", "status"}),
        sortable=frozenset({"name", "created_at"}),
        searchable=("name", "code"),
        aggregatable=frozenset({"asset_kind", "mine_id"}),
        expandable={
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            ),
            "subunit": Expansion(
                target_object="subunit",
                local_field="subunit_id",
                target_collection="subunits",
            ),
        },
        default_sort="name",
    )
)

# People are identity, not tenant-owned: a contractor worker who moves
# between operators is the same person. Scoping lives on the relationship,
# so this collection carries no mine field to clip against.
PEOPLE = registry.register(
    ResourceSpec(
        collection="people",
        object_type="person",
        model=Person,
        read_capability="person.read",
        state_field="status",
        tenant_field=None,
        mine_field=None,
        version_field=None,
        filterable=frozenset({"status", "primary_email"}),
        sortable=frozenset({"display_name", "created_at"}),
        searchable=("display_name", "primary_email"),
        hidden_fields=frozenset({"phone"}),
        default_sort="display_name",
    )
)
