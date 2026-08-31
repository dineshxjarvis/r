"""AI governance chain and signals.

Mirrors migrations/sql/0008_analytics.sql. The chain is what lets an AI
output name its own provenance: use case version -> model + prompt + provider
-> deployment -> run -> signal. A signal that cannot say which model produced
it, from which inputs, is not evidence of anything.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, pg_enum


class AiUseCase(Base):
    __tablename__ = "ai_use_case"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AiUseCaseVersion(Base):
    __tablename__ = "ai_use_case_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    use_case_id: Mapped[str] = mapped_column(Text, ForeignKey("ai_use_case.id"))
    version_no: Mapped[int] = mapped_column(Integer)
    purpose: Mapped[str] = mapped_column(Text)
    decision_influence: Mapped[str] = mapped_column(pg_enum("ai_decision_influence"))
    affected_actors: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    risk_tier: Mapped[str] = mapped_column(pg_enum("ai_risk_tier"))
    intended_use: Mapped[str] = mapped_column(Text)
    excluded_use: Mapped[str] = mapped_column(Text)
    human_workflow: Mapped[str] = mapped_column(Text)
    fallback: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("ai_lifecycle_status"))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_by_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    effective_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AiProviderProfile(Base):
    __tablename__ = "ai_provider_profile"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(Text)
    deployment: Mapped[str] = mapped_column(Text)
    data_retention_terms: Mapped[dict[str, Any]] = mapped_column(JSONB)
    approved_classifications: Mapped[list[str]] = mapped_column(ARRAY(Text))
    active: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AiModel(Base):
    __tablename__ = "ai_model"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    model_type: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AiModelVersion(Base):
    __tablename__ = "ai_model_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    ai_model_id: Mapped[str] = mapped_column(Text, ForeignKey("ai_model.id"))
    version_no: Mapped[int] = mapped_column(Integer)
    provider_profile_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("ai_provider_profile.id")
    )
    provider_model_id: Mapped[str | None] = mapped_column(Text)
    algorithm: Mapped[str | None] = mapped_column(Text)
    config: Mapped[dict[str, Any]] = mapped_column(JSONB)
    training_manifest: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    license: Mapped[str | None] = mapped_column(Text)
    content_hash: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("ai_lifecycle_status"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AiPromptTemplateVersion(Base):
    __tablename__ = "ai_prompt_template_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    version_no: Mapped[int] = mapped_column(Integer)
    system_template: Mapped[str | None] = mapped_column(Text)
    user_template: Mapped[str] = mapped_column(Text)
    tools: Mapped[list[Any]] = mapped_column(JSONB)
    retrieval_policy: Mapped[dict[str, Any]] = mapped_column(JSONB)
    output_schema: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    safety_controls: Mapped[dict[str, Any]] = mapped_column(JSONB)
    content_hash: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("ai_lifecycle_status"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AiDeployment(Base):
    __tablename__ = "ai_deployment"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    use_case_version_id: Mapped[str] = mapped_column(Text, ForeignKey("ai_use_case_version.id"))
    model_version_id: Mapped[str] = mapped_column(Text, ForeignKey("ai_model_version.id"))
    prompt_template_version_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("ai_prompt_template_version.id")
    )
    provider_profile_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("ai_provider_profile.id")
    )
    environment: Mapped[str] = mapped_column(Text)
    traffic_mode: Mapped[str] = mapped_column(Text)
    thresholds: Mapped[dict[str, Any]] = mapped_column(JSONB)
    fallback: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("ai_lifecycle_status"))
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    retired_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AiRun(Base):
    """One inference. `input_manifest` carries the record ids and content
    hashes the run was grounded in, which is what makes a later "why did it
    say that" answerable rather than a guess."""

    __tablename__ = "ai_run"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str | None] = mapped_column(Text, ForeignKey("tenant.id"))
    deployment_id: Mapped[str] = mapped_column(Text, ForeignKey("ai_deployment.id"))
    use_case_version_id: Mapped[str] = mapped_column(Text, ForeignKey("ai_use_case_version.id"))
    model_version_id: Mapped[str] = mapped_column(Text, ForeignKey("ai_model_version.id"))
    prompt_template_version_id: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("ai_run_status"))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    input_manifest: Mapped[dict[str, Any]] = mapped_column(JSONB)
    output_manifest: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    warnings: Mapped[list[Any]] = mapped_column(JSONB)
    cost: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    trace_id: Mapped[str | None] = mapped_column(Text)
    error: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SignalDefinition(Base):
    __tablename__ = "signal_definition"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SignalDefinitionVersion(Base):
    """The trigger rule is deterministic. Where a generative model is
    involved it writes the *explanation*, never the score — so the same
    inputs always produce the same severity."""

    __tablename__ = "signal_definition_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    signal_definition_id: Mapped[str] = mapped_column(Text, ForeignKey("signal_definition.id"))
    version_no: Mapped[int] = mapped_column(Integer)
    eligible_population: Mapped[dict[str, Any]] = mapped_column(JSONB)
    trigger_rule: Mapped[dict[str, Any]] = mapped_column(JSONB)
    deployment_id: Mapped[str | None] = mapped_column(Text, ForeignKey("ai_deployment.id"))
    semantics: Mapped[str] = mapped_column(Text)
    threshold: Mapped[dict[str, Any]] = mapped_column(JSONB)
    severity_map: Mapped[dict[str, Any]] = mapped_column(JSONB)
    recipients: Mapped[dict[str, Any]] = mapped_column(JSONB)
    suppression: Mapped[dict[str, Any]] = mapped_column(JSONB)
    response_contract: Mapped[dict[str, Any]] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(pg_enum("ai_lifecycle_status"))
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    effective_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SignalInstance(Base):
    """Immutable emitted signal. Dismissal is a state, not a delete — a
    signal someone waved away stays auditable."""

    __tablename__ = "signal_instance"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    signal_definition_version_id: Mapped[str] = mapped_column(
        Text, ForeignKey("signal_definition_version.id")
    )
    ai_run_id: Mapped[str | None] = mapped_column(Text, ForeignKey("ai_run.id"))
    subject_type: Mapped[str] = mapped_column(Text)
    subject_id: Mapped[str] = mapped_column(Text)
    mine_id: Mapped[str | None] = mapped_column(Text, ForeignKey("mine.id"))
    window_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    window_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    score: Mapped[Decimal | None] = mapped_column(Numeric(6, 3))
    category: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(pg_enum("severity"))
    explanation: Mapped[str | None] = mapped_column(Text)
    grounding_refs: Mapped[list[Any]] = mapped_column(JSONB)
    state: Mapped[str] = mapped_column(pg_enum("signal_state"))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    superseded_by_id: Mapped[str | None] = mapped_column(Text)
    row_version: Mapped[int] = mapped_column(Integer)
    emitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SignalReview(Base):
    __tablename__ = "signal_review"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    signal_instance_id: Mapped[str] = mapped_column(Text, ForeignKey("signal_instance.id"))
    reviewer_person_id: Mapped[str] = mapped_column(Text, ForeignKey("person.id"))
    reviewer_appointment_id: Mapped[str | None] = mapped_column(Text, ForeignKey("appointment.id"))
    disposition: Mapped[str] = mapped_column(pg_enum("signal_disposition"))
    reason: Mapped[str | None] = mapped_column(Text)
    domain_link_type: Mapped[str | None] = mapped_column(Text)
    domain_link_id: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class MetricVersion(Base):
    __tablename__ = "metric_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    metric_key: Mapped[str] = mapped_column(Text)
    version_no: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(Text)
    definition: Mapped[dict[str, Any]] = mapped_column(JSONB)
    owner: Mapped[str | None] = mapped_column(Text)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    effective_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


__all__ = [
    "AiDeployment",
    "AiModel",
    "AiModelVersion",
    "AiPromptTemplateVersion",
    "AiProviderProfile",
    "AiRun",
    "AiUseCase",
    "AiUseCaseVersion",
    "MetricVersion",
    "SignalDefinition",
    "SignalDefinitionVersion",
    "SignalInstance",
    "SignalReview",
]
