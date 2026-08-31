"""Registered collections for the defect pipeline."""

from __future__ import annotations

from typing import Any

from sqlalchemy import Select

from app.domains.defects.actions import (
    CAPA_ACTIONS,
    DEFECT_ACTIONS,
    FINDING_ACTIONS,
    OBSERVATION_ACTIONS,
)
from app.domains.defects.models import Capa, Defect, Finding, Observation
from app.kernel.registry import Expansion, ResourceSpec, ViewSpec, registry


def _open_capas(stmt: Select[Any]) -> Select[Any]:
    return stmt.where(Capa.status.notin_(["VERIFIED_CLOSED"]))


def _awaiting_verification(stmt: Select[Any]) -> Select[Any]:
    return stmt.where(Capa.status == "SUBMITTED")


def _recurring_defects(stmt: Select[Any]) -> Select[Any]:
    """Backs the CAPA-effectiveness view: conditions that came back."""
    return stmt.where(Defect.recurrence_count > 0)


def _pending_observations(stmt: Select[Any]) -> Select[Any]:
    return stmt.where(Observation.match_decision == "PENDING")


OBSERVATIONS = registry.register(
    ResourceSpec(
        collection="observations",
        object_type="observation",
        model=Observation,
        read_capability="observation.read",
        create_capability="observation.create",
        state_field="match_decision",
        # Field capture happens offline, so the client owns the ID and a
        # replayed sync is a no-op rather than a duplicate row.
        client_generated_ids=True,
        filterable=frozenset(
            {
                "mine_id",
                "source_type",
                "match_decision",
                "normalised_severity",
                "matched_defect_id",
                "inspection_id",
                "reported_by_person_id",
                "observed_at",
            }
        ),
        sortable=frozenset({"observed_at", "created_at", "normalised_severity"}),
        searchable=("description",),
        aggregatable=frozenset({"mine_id", "match_decision", "normalised_severity", "source_type"}),
        creatable=frozenset(
            {
                "id",
                "mine_id",
                "description",
                "raised_severity",
                "observed_at",
                "at_subunit_id",
                "at_asset_id",
                "inspection_id",
                "inspection_visit_id",
                "source_type",
            }
        ),
        required_on_create=frozenset({"mine_id", "description", "raised_severity", "observed_at"}),
        expandable={
            "defect": Expansion(
                target_object="defect",
                local_field="matched_defect_id",
                target_collection="defects",
            ),
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            ),
        },
        views={
            "pending": ViewSpec(
                name="pending",
                summary="Sightings still awaiting a match decision",
                apply=_pending_observations,
            )
        },
        actions=OBSERVATION_ACTIONS,
        default_sort="-observed_at",
    )
)

DEFECTS = registry.register(
    ResourceSpec(
        collection="defects",
        object_type="defect",
        model=Defect,
        read_capability="defect.read",
        state_field="status",
        filterable=frozenset(
            {
                "mine_id",
                "status",
                "current_severity",
                "recurrence_count",
                "first_observed_on",
                "at_asset_id",
                "at_subunit_id",
            }
        ),
        sortable=frozenset(
            {"first_observed_on", "recurrence_count", "created_at", "current_severity"}
        ),
        searchable=("title", "description"),
        aggregatable=frozenset({"mine_id", "status", "current_severity"}),
        patchable=frozenset({"title", "description"}),
        expandable={
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            )
        },
        views={
            "recurring": ViewSpec(
                name="recurring",
                summary="Conditions that recurred after being closed",
                apply=_recurring_defects,
            )
        },
        actions=DEFECT_ACTIONS,
        default_sort="-first_observed_on",
    )
)

FINDINGS = registry.register(
    ResourceSpec(
        collection="findings",
        object_type="finding",
        model=Finding,
        read_capability="finding.read",
        create_capability="finding.raise",
        state_field="status",
        filterable=frozenset(
            {
                "mine_id",
                "status",
                "severity",
                "defect_id",
                "obligation_instance_id",
                "issuing_authority_id",
                "responsible_organization_id",
            }
        ),
        sortable=frozenset({"created_at", "severity"}),
        aggregatable=frozenset({"mine_id", "status", "severity", "issuing_authority_id"}),
        creatable=frozenset(
            {
                "mine_id",
                "defect_id",
                "obligation_instance_id",
                "requirement_obligation_id",
                "severity",
                "responsible_organization_id",
            }
        ),
        required_on_create=frozenset({"mine_id", "requirement_obligation_id", "severity"}),
        expandable={
            "defect": Expansion(
                target_object="defect", local_field="defect_id", target_collection="defects"
            ),
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            ),
        },
        actions=FINDING_ACTIONS,
        default_sort="-created_at",
    )
)

CAPAS = registry.register(
    ResourceSpec(
        collection="capas",
        object_type="capa",
        model=Capa,
        read_capability="capa.read",
        state_field="status",
        filterable=frozenset(
            {
                "mine_id",
                "status",
                "finding_id",
                "assigned_to_person_id",
                "due_on",
                "extension_count",
                "finding.severity",
            }
        ),
        sortable=frozenset({"due_on", "created_at", "extension_count"}),
        aggregatable=frozenset({"mine_id", "status", "assigned_to_person_id"}),
        expandable={
            "finding": Expansion(
                target_object="finding",
                local_field="finding_id",
                target_collection="findings",
            ),
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            ),
        },
        views={
            "open": ViewSpec(
                name="open",
                summary="Everything not yet verified closed",
                apply=_open_capas,
            ),
            "awaiting_verification": ViewSpec(
                name="awaiting_verification",
                summary="Submitted and waiting on a verifier",
                apply=_awaiting_verification,
            ),
        },
        actions=CAPA_ACTIONS,
        default_sort="due_on",
    )
)
