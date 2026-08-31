"""Document pipeline, extractions and the obligation register.

Mirrors migrations/sql/0003_documents.sql.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, pg_enum


class Upload(Base):
    """Two-phase upload staging. A document row may not exist until the bytes
    behind it have been fetched back and their hash verified."""

    __tablename__ = "upload"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    purpose: Mapped[str] = mapped_column(pg_enum("upload_purpose"))
    requested_by_principal_id: Mapped[str] = mapped_column(Text, ForeignKey("principal.id"))
    claimed_sha256: Mapped[str] = mapped_column(Text)
    byte_size: Mapped[int | None] = mapped_column(BigInteger)
    content_type: Mapped[str] = mapped_column(Text)
    storage_bucket: Mapped[str] = mapped_column(Text)
    storage_key: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("upload_status"))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    consumed_by_type: Mapped[str | None] = mapped_column(Text)
    consumed_by_id: Mapped[str | None] = mapped_column(Text)
    failure_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Document(Base):
    __tablename__ = "document"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    mine_id: Mapped[str | None] = mapped_column(Text, ForeignKey("mine.id"))
    doc_class: Mapped[str] = mapped_column(pg_enum("doc_class"))
    title: Mapped[str] = mapped_column(Text)
    original_filename: Mapped[str] = mapped_column(Text)
    issuing_authority_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("regulatory_authority.id")
    )
    issuing_authority_unit_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("authority_unit.id")
    )
    owner_organization_id: Mapped[str | None] = mapped_column(Text, ForeignKey("organization.id"))
    content_hash: Mapped[str] = mapped_column(Text)
    storage_bucket: Mapped[str] = mapped_column(Text)
    storage_key: Mapped[str] = mapped_column(Text)
    byte_size: Mapped[int] = mapped_column(BigInteger)
    content_type: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("document_status"))
    uploaded_by_principal_id: Mapped[str] = mapped_column(Text, ForeignKey("principal.id"))
    version_no: Mapped[int] = mapped_column(Integer)
    superseded_by_id: Mapped[str | None] = mapped_column(Text, ForeignKey("document.id"))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    published_by_principal_id: Mapped[str | None] = mapped_column(Text)
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    withdrawn_by_principal_id: Mapped[str | None] = mapped_column(Text)
    withdraw_reason: Mapped[str | None] = mapped_column(Text)
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class DocumentProcessingJob(Base):
    __tablename__ = "document_processing_job"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    document_id: Mapped[str] = mapped_column(Text, ForeignKey("document.id"))
    stage: Mapped[str] = mapped_column(pg_enum("pipeline_stage"))
    attempt_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(pg_enum("job_status"))
    operation_id: Mapped[str | None] = mapped_column(Text, ForeignKey("operation.id"))
    error_message: Mapped[str | None] = mapped_column(Text)
    worker_ref: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class DocumentSegment(Base):
    """One clause. `text_hash` is what an AI proposal cites as its grounding,
    so a later edit to the source is detectable rather than silent."""

    __tablename__ = "document_segment"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    document_id: Mapped[str] = mapped_column(Text, ForeignKey("document.id"))
    segment_ref: Mapped[str] = mapped_column(Text)
    sequence_no: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    text_hash: Mapped[str] = mapped_column(Text)
    page_no: Mapped[int | None] = mapped_column(Integer)
    bbox: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Extraction(Base):
    __tablename__ = "extraction"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    document_id: Mapped[str] = mapped_column(Text, ForeignKey("document.id"))
    segment_id: Mapped[str] = mapped_column(Text, ForeignKey("document_segment.id"))
    extractor: Mapped[str] = mapped_column(Text)
    extraction_type: Mapped[str] = mapped_column(pg_enum("extraction_type"))
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    anchor: Mapped[str] = mapped_column(Text)
    field_anchors: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    confidence: Mapped[Decimal] = mapped_column(Numeric(4, 3))
    field_confidence: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    ai_run_id: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("extraction_status"))
    reviewed_by_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    review_note: Mapped[str | None] = mapped_column(Text)
    split_from_id: Mapped[str | None] = mapped_column(Text, ForeignKey("extraction.id"))
    merged_into_id: Mapped[str | None] = mapped_column(Text, ForeignKey("extraction.id"))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Obligation(Base):
    __tablename__ = "obligation"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    source_document_id: Mapped[str] = mapped_column(Text, ForeignKey("document.id"))
    source_segment_id: Mapped[str] = mapped_column(Text, ForeignKey("document_segment.id"))
    source_extraction_id: Mapped[str | None] = mapped_column(Text, ForeignKey("extraction.id"))
    shared_obligation_id: Mapped[str] = mapped_column(Text)
    clause_ref: Mapped[str] = mapped_column(Text)
    deontic: Mapped[str] = mapped_column(pg_enum("deontic"))
    title: Mapped[str] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    owner_position_template_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("position_template.id")
    )
    periodicity: Mapped[str] = mapped_column(pg_enum("periodicity"))
    due_rule_kind: Mapped[str] = mapped_column(pg_enum("due_rule_kind"))
    due_rule_detail: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    grace_period_days: Mapped[int] = mapped_column(Integer)
    source_scope: Mapped[str] = mapped_column(pg_enum("obligation_source_scope"))
    anchor_event: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(pg_enum("severity"))
    nil_permitted: Mapped[bool] = mapped_column(Boolean)
    active: Mapped[bool] = mapped_column(Boolean)
    version_no: Mapped[int] = mapped_column(Integer)
    superseded_by_id: Mapped[str | None] = mapped_column(Text, ForeignKey("obligation.id"))
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    published_by_principal_id: Mapped[str | None] = mapped_column(Text)
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ObligationApplicabilityRule(Base):
    __tablename__ = "obligation_applicability_rule"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    obligation_id: Mapped[str] = mapped_column(Text, ForeignKey("obligation.id"))
    kind: Mapped[str] = mapped_column(pg_enum("applicability_kind"))
    detail: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ObligationInstance(Base):
    __tablename__ = "obligation_instance"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    obligation_id: Mapped[str] = mapped_column(Text, ForeignKey("obligation.id"))
    mine_id: Mapped[str] = mapped_column(Text, ForeignKey("mine.id"))
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    due_on: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(pg_enum("instance_status"))
    status_reason: Mapped[str | None] = mapped_column(Text)
    reconciliation: Mapped[str | None] = mapped_column(pg_enum("reconciliation_verdict"))
    submitted_by_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    verified_by_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finding_id: Mapped[str | None] = mapped_column(Text)
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ObligationEvidenceLink(Base):
    __tablename__ = "obligation_evidence_link"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    obligation_instance_id: Mapped[str] = mapped_column(Text, ForeignKey("obligation_instance.id"))
    evidence_id: Mapped[str] = mapped_column(Text)
    match_outcome: Mapped[str] = mapped_column(pg_enum("evidence_match_outcome"))
    linked_by_person_id: Mapped[str] = mapped_column(Text, ForeignKey("person.id"))
    linked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ObligationConflict(Base):
    __tablename__ = "obligation_conflict"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    conflict_type: Mapped[str] = mapped_column(pg_enum("conflict_type"))
    obligation_a_id: Mapped[str] = mapped_column(Text, ForeignKey("obligation.id"))
    obligation_b_id: Mapped[str] = mapped_column(Text, ForeignKey("obligation.id"))
    detail: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    detected_by_run_id: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("conflict_status"))
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolved_by_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolution_note: Mapped[str | None] = mapped_column(Text)
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


__all__ = [
    "Document",
    "DocumentProcessingJob",
    "DocumentSegment",
    "Extraction",
    "Obligation",
    "ObligationApplicabilityRule",
    "ObligationConflict",
    "ObligationEvidenceLink",
    "ObligationInstance",
    "Upload",
]
