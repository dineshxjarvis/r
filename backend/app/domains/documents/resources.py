"""Registered collections for documents, extractions and the obligation register."""

from __future__ import annotations

from typing import Any

from sqlalchemy import Select

from app.domains.documents.actions import (
    CONFLICT_ACTIONS,
    EXTRACTION_ACTIONS,
    INSTANCE_ACTIONS,
)
from app.domains.documents.models import (
    Document,
    Extraction,
    Obligation,
    ObligationConflict,
    ObligationInstance,
)
from app.kernel.registry import Expansion, ResourceSpec, ViewSpec, registry


def _review_queue(stmt: Select[Any]) -> Select[Any]:
    return stmt.where(Extraction.status == "PROPOSED")


def _current_obligations(stmt: Select[Any]) -> Select[Any]:
    """Only obligations that have not been superseded by a later version."""
    return stmt.where(Obligation.active.is_(True), Obligation.superseded_by_id.is_(None))


def _overdue_instances(stmt: Select[Any]) -> Select[Any]:
    return stmt.where(ObligationInstance.status.in_(["OVERDUE", "ESCALATED"]))


def _published_documents(stmt: Select[Any]) -> Select[Any]:
    return stmt.where(Document.status.in_(["PUBLISHED", "SIGNED"]))


DOCUMENTS = registry.register(
    ResourceSpec(
        collection="documents",
        object_type="document",
        model=Document,
        read_capability="document.read",
        create_capability="document.create",
        state_field="status",
        filterable=frozenset(
            {"mine_id", "doc_class", "status", "issuing_authority_id", "content_hash"}
        ),
        sortable=frozenset({"created_at", "published_at", "title"}),
        searchable=("title", "original_filename"),
        aggregatable=frozenset({"doc_class", "status", "mine_id"}),
        patchable=frozenset({"title"}),
        creatable=frozenset({"mine_id", "doc_class", "title", "upload_id", "issuing_authority_id"}),
        required_on_create=frozenset({"doc_class", "title", "upload_id"}),
        expandable={
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            )
        },
        views={
            "published": ViewSpec(
                name="published",
                summary="Documents that have completed review",
                apply=_published_documents,
            ),
            # Segments ride the document collection rather than a separate
            # route: same authorization path, same lifecycle, different
            # projection.
            "segments": ViewSpec(
                name="segments",
                summary="Clause segments across documents",
                apply=lambda stmt: stmt,
            ),
        },
        default_sort="-created_at",
    )
)

EXTRACTIONS = registry.register(
    ResourceSpec(
        collection="extractions",
        object_type="extraction",
        model=Extraction,
        read_capability="extraction.read",
        state_field="status",
        mine_field=None,  # scoped through its document, not directly by mine
        filterable=frozenset(
            {"document_id", "segment_id", "extraction_type", "status", "confidence", "ai_run_id"}
        ),
        sortable=frozenset({"confidence", "created_at"}),
        aggregatable=frozenset({"extraction_type", "status"}),
        expandable={
            "document": Expansion(
                target_object="document",
                local_field="document_id",
                target_collection="documents",
            ),
        },
        views={
            "review_queue": ViewSpec(
                name="review_queue",
                summary="Proposals awaiting a human decision",
                apply=_review_queue,
            )
        },
        actions=EXTRACTION_ACTIONS,
        default_sort="-confidence",
    )
)

OBLIGATIONS = registry.register(
    ResourceSpec(
        collection="obligations",
        object_type="obligation",
        model=Obligation,
        read_capability="obligation.read",
        mine_field=None,  # an obligation is tenant-level; instances are per mine
        filterable=frozenset(
            {
                "source_document_id",
                "deontic",
                "periodicity",
                "severity",
                "active",
                "shared_obligation_id",
                "owner_position_template_id",
            }
        ),
        sortable=frozenset({"created_at", "title", "severity"}),
        searchable=("title", "summary", "clause_ref"),
        aggregatable=frozenset({"periodicity", "severity", "deontic"}),
        expandable={
            "source_document": Expansion(
                target_object="document",
                local_field="source_document_id",
                target_collection="documents",
            )
        },
        views={
            "current": ViewSpec(
                name="current",
                summary="Active, unsuperseded obligations",
                apply=_current_obligations,
            ),
            "applicability_rules": ViewSpec(
                name="applicability_rules",
                summary="Which mines each obligation reaches, and why",
                apply=lambda stmt: stmt,
            ),
        },
        default_sort="title",
    )
)

OBLIGATION_INSTANCES = registry.register(
    ResourceSpec(
        collection="obligation-instances",
        object_type="obligation_instance",
        model=ObligationInstance,
        read_capability="obligation_instance.read",
        state_field="status",
        filterable=frozenset(
            {
                "mine_id",
                "obligation_id",
                "status",
                "due_on",
                "period_start",
                "period_end",
                "reconciliation",
                "obligation.severity",
            }
        ),
        sortable=frozenset({"due_on", "period_start", "created_at"}),
        aggregatable=frozenset({"mine_id", "status", "reconciliation"}),
        expandable={
            "obligation": Expansion(
                target_object="obligation",
                local_field="obligation_id",
                target_collection="obligations",
            ),
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            ),
        },
        views={
            "overdue": ViewSpec(
                name="overdue",
                summary="Past due and escalated periods",
                apply=_overdue_instances,
            )
        },
        actions=INSTANCE_ACTIONS,
        default_sort="due_on",
    )
)

OBLIGATION_CONFLICTS = registry.register(
    ResourceSpec(
        collection="obligation-conflicts",
        object_type="obligation_conflict",
        model=ObligationConflict,
        read_capability="obligation_conflict.read",
        state_field="status",
        mine_field=None,
        filterable=frozenset({"conflict_type", "status", "obligation_a_id", "obligation_b_id"}),
        sortable=frozenset({"detected_at"}),
        aggregatable=frozenset({"conflict_type", "status"}),
        actions=CONFLICT_ACTIONS,
        default_sort="-detected_at",
    )
)
