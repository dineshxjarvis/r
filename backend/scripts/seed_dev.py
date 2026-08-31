"""Seed a working demo dataset.

Idempotent: re-running truncates the domain tables it owns and rebuilds them,
so a broken demo is one command away from a good one.

What it builds, and why each piece is there:

  * one tenant, one operator organisation, one regulator (DGMS)
  * three mines with real coordinates in the Korba coalfield
  * five people with the posts, appointments and capability policies that
    actually grant what they can do — no role strings anywhere
  * a published EC document, its clause segments, and AI-proposed extractions
    still sitting in the review queue
  * obligations and per-mine instances across every status the dashboard reads
  * a defect that recurred, its finding, and two CAPAs
  * **two captures for the same CAPA**: one inside the geofence and one 847 m
    away, so the closure gate can be demonstrated blocking and then passing
  * governed geometry (lease boundary + a 100 m asset geofence) for it to
    measure against
  * signals from all three AI features, each naming the run that produced it

Run:  uv run python scripts/seed_dev.py
"""

from __future__ import annotations

import asyncio
import os
import sys
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

from argon2 import PasswordHasher
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.ids import new_id  # noqa: E402

hasher = PasswordHasher()
NOW = datetime.now(UTC)
DEMO_PASSWORD = "strata-demo"  # noqa: S105 - seed fixture, local demo only

# Tables this script owns, in reverse dependency order.
OWNED = [
    "signal_review", "signal_delivery", "signal_instance",
    "signal_definition_version", "signal_definition",
    "ai_run", "ai_deployment", "ai_prompt_template_version",
    "ai_model_version", "ai_model", "ai_provider_profile",
    "ai_use_case_version", "ai_use_case",
    "metric_manifest", "metric_version",
    "notification_delegate", "notification",
    "spatial_evaluation_override", "spatial_evaluation",
    "map_composition_version", "governed_geometry_version", "governed_geometry",
    "spatial_policy_version", "spatial_layer_definition",
    "spatial_reference_system_profile",
    "evidence_verification_attempt", "evidence",
    "inspection_decision", "inspection_relation", "inspection_report",
    "inspection_response_evidence", "inspection_response",
    "inspection_checklist_item", "inspection_checklist_instance",
    "inspection_access_event", "inspection_visit_attendance",
    "inspection_visit_target", "inspection_visit",
    "assignment_competency", "inspection_assignment_member",
    "inspection_assignment_version", "inspection_target", "inspection",
    "inspection_type_competency", "inspection_type_version",
    "checklist_template_item", "checklist_template_version",
    "inspection_competency", "inspection_type",
    "capa", "finding", "observation_embedding", "observation", "defect",
    "nil_return", "obligation_evidence_link", "obligation_conflict",
    "obligation_instance", "obligation_applicability_rule", "obligation",
    "extraction", "document_segment_embedding", "document_segment",
    "document_processing_job", "document", "upload",
    "authorization_decision", "break_glass_grant", "resource_closure_policy",
    "position_capability_policy", "jurisdiction_assignment",
    "mandate_assignment", "mandate_capability", "mandate", "authority_unit",
    "regulatory_authority", "appointment", "post", "position_template",
    "capability", "asset", "subunit", "mine", "session",
    "passkey_credential", "oidc_identity", "password_authenticator",
    "affiliation", "principal", "person", "organization_unit", "organization",
    "tenant", "domain_audit_event", "audit_stream_head", "outbox_message",
    "inbox_message", "consumer_checkpoint", "idempotency_key", "operation",
    "access_event", "security_event", "enum_registry",
]

# --- capability catalogue -------------------------------------------------
# A capability is an action, never a title. The catalogue is data, so adding
# one is a row rather than a migration.
CAPABILITIES = [
    ("mine.read_internal", "Read internal mine records", "LOW", "PASSWORD"),
    ("mine.configure", "Onboard and configure a mine", "MEDIUM", "MFA"),
    ("person.read", "Read person records", "LOW", "PASSWORD"),
    ("document.read", "Read documents", "LOW", "PASSWORD"),
    ("document.create", "Register a document", "MEDIUM", "PASSWORD"),
    ("extraction.read", "Read AI extraction proposals", "LOW", "PASSWORD"),
    ("extraction.review", "Accept, edit or reject a proposal", "MEDIUM", "PASSWORD"),
    ("obligation.read", "Read the obligation register", "LOW", "PASSWORD"),
    ("obligation_instance.read", "Read obligation periods", "LOW", "PASSWORD"),
    ("obligation_instance.submit", "Submit a period's compliance", "MEDIUM", "PASSWORD"),
    ("obligation_instance.verify", "Verify a submitted period", "HIGH", "PASSWORD"),
    ("obligation_instance.waive", "Waive or exclude a period", "HIGH", "MFA"),
    ("obligation_conflict.read", "Read detected conflicts", "LOW", "PASSWORD"),
    ("obligation_conflict.resolve", "Settle a conflict", "MEDIUM", "PASSWORD"),
    ("observation.read", "Read field observations", "LOW", "PASSWORD"),
    ("observation.create", "Record a field observation", "LOW", "PASSWORD"),
    ("observation.match", "Resolve an observation to a defect", "MEDIUM", "PASSWORD"),
    ("defect.read", "Read defects", "LOW", "PASSWORD"),
    ("defect.reclassify", "Change a defect's severity", "MEDIUM", "PASSWORD"),
    ("finding.read", "Read findings", "LOW", "PASSWORD"),
    ("finding.raise", "Raise a finding", "MEDIUM", "PASSWORD"),
    ("finding.reopen", "Reopen a closed finding", "HIGH", "MFA"),
    ("capa.read", "Read CAPAs", "LOW", "PASSWORD"),
    ("capa.create", "Open a CAPA", "MEDIUM", "PASSWORD"),
    ("capa.assign", "Assign a CAPA", "MEDIUM", "PASSWORD"),
    ("capa.update", "Work and submit a CAPA", "LOW", "PASSWORD"),
    ("capa.verify", "Verify and close a CAPA", "HIGH", "PASSWORD"),
    ("capa.extend_deadline", "Extend a CAPA deadline", "HIGH", "PASSWORD"),
    ("evidence.read", "Read captured evidence", "LOW", "PASSWORD"),
    ("evidence.capture", "Capture and sync evidence", "LOW", "PASSWORD"),
    ("evidence.relink", "Move a capture to another target", "MEDIUM", "PASSWORD"),
    ("evidence.override_verdict", "Override a suspect verdict", "CRITICAL", "MFA"),
    ("inspection.read", "Read inspections", "LOW", "PASSWORD"),
    ("inspection.plan", "Schedule and cancel inspections", "MEDIUM", "PASSWORD"),
    ("inspection.conduct", "Conduct fieldwork", "MEDIUM", "PASSWORD"),
    ("inspection.respond_assignment", "Accept or decline a team place", "LOW", "PASSWORD"),
    ("inspection.prepare_report", "Prepare an inspection report", "MEDIUM", "PASSWORD"),
    ("inspection.review_report", "Review a report", "HIGH", "PASSWORD"),
    ("inspection.issue_internal", "Issue an internal report", "HIGH", "PASSWORD"),
    ("inspection.issue_regulatory", "Issue a regulatory report", "CRITICAL", "MFA"),
    ("inspection.close", "Close an inspection", "HIGH", "PASSWORD"),
    ("inspection.reopen", "Reopen a closed inspection", "HIGH", "MFA"),
    ("geospatial.read", "Read governed geometry", "LOW", "PASSWORD"),
    ("geospatial.compose", "Build a map composition", "MEDIUM", "PASSWORD"),
    ("geospatial.evaluate", "Run a spatial evaluation", "LOW", "PASSWORD"),
    ("signal.read", "Read AI signals", "LOW", "PASSWORD"),
    ("signal.review", "Dispose of an AI signal", "MEDIUM", "PASSWORD"),
    ("ai.read_lineage", "Read AI run lineage", "LOW", "PASSWORD"),
    ("notification.read", "Read own notifications", "LOW", "PASSWORD"),
    ("notification.delegate", "Register a notification delegate", "MEDIUM", "PASSWORD"),
    ("dashboard.read", "Read dashboards and metrics", "LOW", "PASSWORD"),
    ("portfolio.read", "Read across tenants", "HIGH", "MFA"),
]

# Which position holds which capabilities. This is the whole grant model:
# capability comes from a position policy or a regulator mandate, never from
# a name.
OPERATOR_READS = [
    "mine.read_internal", "person.read", "document.read", "obligation.read",
    "obligation_instance.read", "observation.read", "defect.read",
    "finding.read", "capa.read", "evidence.read", "inspection.read",
    "geospatial.read", "signal.read", "ai.read_lineage",
    "notification.read", "dashboard.read", "extraction.read",
    "obligation_conflict.read",
]

POSITION_POLICY: dict[str, list[str]] = {
    "MINE_MANAGER": OPERATOR_READS
    + [
        "capa.assign", "capa.create", "capa.update", "capa.verify",
        "capa.extend_deadline", "finding.raise", "observation.match",
        "observation.create", "defect.reclassify",
        "obligation_instance.submit", "obligation_instance.verify",
        "obligation_instance.waive", "evidence.capture", "evidence.relink",
        "evidence.override_verdict", "inspection.plan", "inspection.conduct",
        "inspection.close", "signal.review", "mine.configure",
        "document.create", "extraction.review", "obligation_conflict.resolve",
        "geospatial.compose", "geospatial.evaluate", "notification.delegate",
    ],
    "SAFETY_OFFICER": OPERATOR_READS
    + [
        "capa.create", "capa.update", "capa.assign", "finding.raise",
        "observation.create", "observation.match", "evidence.capture",
        "obligation_instance.submit", "inspection.conduct",
        "inspection.respond_assignment", "inspection.prepare_report",
        "signal.review", "geospatial.evaluate",
    ],
    "COMPLIANCE_OFFICER": OPERATOR_READS
    + [
        "document.create", "extraction.review", "obligation_conflict.resolve",
        "obligation_instance.submit", "capa.update", "signal.review",
    ],
    "INSPECTOR_OF_MINES": OPERATOR_READS
    + [
        "inspection.plan", "inspection.conduct", "inspection.respond_assignment",
        "inspection.prepare_report", "inspection.issue_regulatory",
        "inspection.close", "finding.raise", "observation.create",
        "evidence.capture", "geospatial.evaluate",
    ],
    "MINISTRY_ANALYST": OPERATOR_READS + ["portfolio.read"],
}

MINES = [
    ("GEVRA", "Gevra OCP", "OPENCAST", "NOT_APPLICABLE", 52_000_000, 6200, 82.5921, 22.3721),
    ("KUSMUNDA", "Kusmunda OCP", "OPENCAST", "NOT_APPLICABLE", 50_000_000, 5400, 82.7042, 22.3195),
    ("SINGHALI", "Singhali UG", "UNDERGROUND", "DEGREE_II", 800_000, 1100, 82.4410, 22.2887),
]

PEOPLE = [
    ("manager@strata.demo", "R. Mahato", "MINE_MANAGER", "GEVRA"),
    ("safety@strata.demo", "P. Bhattacharya", "SAFETY_OFFICER", "GEVRA"),
    ("compliance@strata.demo", "S. Nandy", "COMPLIANCE_OFFICER", "GEVRA"),
    ("inspector@strata.demo", "A. Kujur", "INSPECTOR_OF_MINES", None),
    ("ministry@strata.demo", "V. Iyer", "MINISTRY_ANALYST", None),
]


async def main() -> None:
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        raise SystemExit("DATABASE_URL is not set")
    engine = create_async_engine(url.replace("+psycopg", "+asyncpg"), echo=False)

    async with engine.begin() as conn:
        # The seed runs as an owner-level connection, so RLS is not in the way
        # of writing rows for several tenants. The application never does this.
        await conn.execute(text("SELECT set_config('app.tenant_id', '', true)"))

        print("clearing owned tables…")
        for table in OWNED:
            await conn.execute(text(f"TRUNCATE TABLE {table} CASCADE"))

        ids = await seed_foundation(conn)
        await seed_geospatial(conn, ids)
        await seed_documents(conn, ids)
        await seed_defect_pipeline(conn, ids)
        await seed_evidence(conn, ids)
        await seed_inspections(conn, ids)
        await seed_analytics(conn, ids)
        await seed_enums(conn)

    await engine.dispose()

    print("\ndone. sign in at POST /api/v1/auth/sessions with:")
    for email, name, position, _ in PEOPLE:
        print(f"  {email:28} {DEMO_PASSWORD:14} {name} ({position})")


async def seed_foundation(conn) -> dict:  # noqa: ANN001
    print("foundation: tenant, organisations, mines, people, appointments…")
    ids: dict = {"mines": {}, "people": {}, "capabilities": {}, "templates": {}}

    tenant_id = new_id("tenant")
    ids["tenant"] = tenant_id
    await conn.execute(
        text(
            "INSERT INTO tenant (id, code, name, status, data_region) "
            "VALUES (:id, 'SECL', 'South Eastern Coalfields Limited', 'ACTIVE', 'ap-south-1')"
        ),
        {"id": tenant_id},
    )

    operator_id = new_id("organization")
    regulator_id = new_id("organization")
    ids["operator"] = operator_id
    await conn.execute(
        text(
            """
            INSERT INTO organization (id, tenant_id, code, legal_name, organization_kind, status)
            VALUES (:op, :tenant, 'SECL-OP', 'SECL Operations', 'OPERATOR', 'ACTIVE'),
                   (:reg, NULL, 'DGMS', 'Directorate General of Mines Safety', 'REGULATOR', 'ACTIVE')
            """
        ),
        {"op": operator_id, "reg": regulator_id, "tenant": tenant_id},
    )

    authority_id = new_id("regulatory_authority")
    ids["authority"] = authority_id
    await conn.execute(
        text(
            """
            INSERT INTO regulatory_authority (id, organization_id, code, name, active)
            VALUES (:id, :org, 'DGMS', 'Directorate General of Mines Safety', true)
            """
        ),
        {"id": authority_id, "org": regulator_id},
    )

    for code, name, mine_type, gassiness, tpa, headcount, lon, lat in MINES:
        mine_id = new_id("mine")
        ids["mines"][code] = mine_id
        await conn.execute(
            text(
                """
                INSERT INTO mine (id, tenant_id, code, name, mine_type, gassiness_class,
                                  production_scale_tpa, headcount, state_code, status,
                                  location, row_version)
                VALUES (:id, :tenant, :code, :name, :mt, :gc, :tpa, :hc, 'IN-CT', 'ACTIVE',
                        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 1)
                """
            ),
            {
                "id": mine_id, "tenant": tenant_id, "code": code, "name": name,
                "mt": mine_type, "gc": gassiness, "tpa": tpa, "hc": headcount,
                "lon": lon, "lat": lat,
            },
        )

    # One haul-road asset at Gevra: the target the demo's closure evidence is
    # measured against.
    asset_id = new_id("asset")
    ids["asset"] = asset_id
    await conn.execute(
        text(
            """
            INSERT INTO asset (id, tenant_id, mine_id, code, name, asset_kind, status,
                               location, row_version)
            VALUES (:id, :tenant, :mine, 'HR-EAST', 'East haul road', 'HAUL_ROAD', 'ACTIVE',
                    ST_SetSRID(ST_MakePoint(82.5931, 22.3731), 4326)::geography, 1)
            """
        ),
        {"id": asset_id, "tenant": tenant_id, "mine": ids["mines"]["GEVRA"]},
    )

    for code, description, risk, assurance in CAPABILITIES:
        cap_id = new_id("capability")
        ids["capabilities"][code] = cap_id
        await conn.execute(
            text(
                """
                INSERT INTO capability (id, code, description, risk_class, required_assurance)
                VALUES (:id, :code, :d, :r, :a)
                """
            ),
            {"id": cap_id, "code": code, "d": description, "r": risk, "a": assurance},
        )

    for template_code in POSITION_POLICY:
        template_id = new_id("position_template")
        ids["templates"][template_code] = template_id
        statutory = template_code in {"MINE_MANAGER", "INSPECTOR_OF_MINES"}
        await conn.execute(
            text(
                """
                INSERT INTO position_template (id, owning_organization_id, code, title,
                                               statutory, default_holder_policy, active)
                VALUES (:id, NULL, :code, :title, :statutory, :policy, true)
                """
            ),
            {
                "id": template_id,
                "code": template_code,
                "title": template_code.replace("_", " ").title(),
                "statutory": statutory,
                # Several inspectors coexist; a mine has one manager.
                "policy": "SINGLE_HOLDER" if statutory and template_code == "MINE_MANAGER" else "MULTI_HOLDER",
            },
        )
        for capability_code in POSITION_POLICY[template_code]:
            await conn.execute(
                text(
                    """
                    INSERT INTO position_capability_policy
                      (id, position_template_id, capability_id, resource_relation)
                    VALUES (:id, :tpl, :cap, :rel)
                    ON CONFLICT DO NOTHING
                    """
                ),
                {
                    "id": new_id("capability"),
                    "tpl": template_id,
                    "cap": ids["capabilities"][capability_code],
                    "rel": capability_code.split(".")[-1],
                },
            )

    password_hash = hasher.hash(DEMO_PASSWORD)
    for email, display_name, template_code, mine_code in PEOPLE:
        person_id = new_id("person")
        principal_id = new_id("principal")
        ids["people"][email] = {"person": person_id, "principal": principal_id}

        await conn.execute(
            text(
                """
                INSERT INTO person (id, display_name, primary_email, status)
                VALUES (:id, :name, :email, 'ACTIVE')
                """
            ),
            {"id": person_id, "name": display_name, "email": email},
        )
        await conn.execute(
            text(
                """
                INSERT INTO principal (id, kind, person_id, status, credential_version)
                VALUES (:id, 'HUMAN', :person, 'ACTIVE', 1)
                """
            ),
            {"id": principal_id, "person": person_id},
        )
        await conn.execute(
            text(
                """
                INSERT INTO password_authenticator (principal_id, password_hash, parameters)
                VALUES (:pid, :hash, '{"algorithm":"argon2id"}'::jsonb)
                """
            ),
            {"pid": principal_id, "hash": password_hash},
        )

        # The affiliation is what ties a person to an organisation — and, for
        # operator staff, what makes their tenant resolvable at login.
        is_regulator = template_code in {"INSPECTOR_OF_MINES", "MINISTRY_ANALYST"}
        await conn.execute(
            text(
                """
                INSERT INTO affiliation (id, person_id, organization_id, affiliation_kind,
                                         valid_from, valid_until)
                VALUES (:id, :person, :org, :kind, :from, NULL)
                """
            ),
            {
                "id": new_id("affiliation"),
                "person": person_id,
                "org": regulator_id if is_regulator else operator_id,
                "kind": "REGULATOR_OFFICER" if is_regulator else "EMPLOYEE",
                "from": NOW - timedelta(days=900),
            },
        )

        post_id = new_id("post")
        scope_type = "mine" if mine_code else "tenant"
        scope_id = ids["mines"][mine_code] if mine_code else tenant_id
        await conn.execute(
            text(
                """
                INSERT INTO post (id, organization_id, position_template_id, holder_policy,
                                  scope_resource_type, scope_resource_id, status)
                VALUES (:id, :org, :tpl, :policy, :st, :si, 'ACTIVE')
                """
            ),
            {
                "id": post_id,
                "org": regulator_id if is_regulator else operator_id,
                "tpl": ids["templates"][template_code],
                "policy": "SINGLE_HOLDER" if template_code == "MINE_MANAGER" else "MULTI_HOLDER",
                "st": scope_type,
                "si": scope_id,
            },
        )

        appointment_id = new_id("appointment")
        ids["people"][email]["appointment"] = appointment_id
        await conn.execute(
            text(
                """
                INSERT INTO appointment (id, person_id, post_id, mode, holder_policy,
                                         valid_from, valid_until, row_version)
                VALUES (:id, :person, :post, 'REGULAR', 'MULTI_HOLDER', :from, :until, 1)
                """
            ),
            {
                "id": appointment_id,
                "person": person_id,
                "post": post_id,
                "from": NOW - timedelta(days=365),
                "until": NOW + timedelta(days=365),
            },
        )

    # The regulator's coverage and the ministry's portfolio are jurisdiction
    # rows, not flags — an inspector with no jurisdiction reaches nothing.
    await conn.execute(
        text(
            """
            INSERT INTO jurisdiction_assignment
              (id, appointment_id, selector_type, selector_schema_version, selector_payload,
               valid_from, valid_until)
            VALUES (:id, :appt, 'MINE_SET', 1, CAST(:payload AS jsonb), :from, :until)
            """
        ),
        {
            "id": new_id("jurisdiction_assignment"),
            "appt": ids["people"]["inspector@strata.demo"]["appointment"],
            "payload": '{"mine_ids": ' + str(list(ids["mines"].values())).replace("'", '"') + "}",
            "from": NOW - timedelta(days=365),
            "until": NOW + timedelta(days=365),
        },
    )
    await conn.execute(
        text(
            """
            INSERT INTO jurisdiction_assignment
              (id, appointment_id, selector_type, selector_schema_version, selector_payload,
               valid_from, valid_until)
            VALUES (:id, :appt, 'PLATFORM_PORTFOLIO', 1, '{}'::jsonb, :from, :until)
            """
        ),
        {
            "id": new_id("jurisdiction_assignment"),
            "appt": ids["people"]["ministry@strata.demo"]["appointment"],
            "from": NOW - timedelta(days=365),
            "until": NOW + timedelta(days=365),
        },
    )

    # Closure ladder: a SEVERE finding needs a higher capability than a MINOR
    # one, and a regulator-issued one is not the operator's to close.
    for category, capability in [
        ("MINOR", "capa.verify"),
        ("SIGNIFICANT", "capa.verify"),
        ("SEVERE", "capa.verify"),
    ]:
        await conn.execute(
            text(
                """
                INSERT INTO resource_closure_policy
                  (id, resource_type, category, required_capability_id, separation_policy)
                VALUES (:id, 'capa', :cat, :cap,
                        '{"verifier_not": ["submitted_by", "assigned_to"]}'::jsonb)
                """
            ),
            {
                "id": new_id("capability"),
                "cat": category,
                "cap": ids["capabilities"][capability],
            },
        )

    return ids


async def seed_geospatial(conn, ids: dict) -> None:  # noqa: ANN001
    print("geospatial: lease boundary and a 100 m asset geofence…")

    await conn.execute(
        text(
            """
            INSERT INTO spatial_reference_system_profile
              (id, code, name, srid, axis_order, unit, area_of_use)
            VALUES (:id, 'EPSG:4326', 'WGS 84', 4326, 'LON_LAT', 'DEGREE', 'World')
            """
        ),
        {"id": new_id("spatial_reference_system_profile")},
    )

    # The geofence policy the closure gate reads its radius from. 100 m is a
    # deliberate, reviewable number living in data rather than in code.
    policy_id = new_id("spatial_policy_version")
    await conn.execute(
        text(
            """
            INSERT INTO spatial_policy_version
              (id, code, version_no, purpose, target_kind, predicate, tolerance_m,
               accuracy_rule, override_policy, effective_from)
            VALUES (:id, 'EVIDENCE_GEOFENCE', 1, 'EVIDENCE_GEOFENCE', 'ASSET',
                    'ST_DWithin', 100, '{}'::jsonb,
                    '{"capability": "evidence.override_verdict"}'::jsonb, :from)
            """
        ),
        {"id": policy_id, "from": NOW - timedelta(days=200)},
    )

    layers = {}
    for code, name, kind, cls, purpose in [
        ("LEASE", "Lease boundary", "MULTIPOLYGON", "LEGAL", "LEASE_BOUNDARY"),
        ("GEOFENCE", "Asset geofence", "POLYGON", "SAFETY", "EVIDENCE_GEOFENCE"),
    ]:
        layer_id = new_id("spatial_layer_definition")
        layers[code] = layer_id
        await conn.execute(
            text(
                """
                INSERT INTO spatial_layer_definition
                  (id, tenant_id, code, name, geometry_kind, layer_class, purpose,
                   classification, allowed_dimensions, schema_version, style, active)
                VALUES (:id, :tenant, :code, :name, :kind, :cls, :purpose,
                        'INTERNAL', '2D', 1, '{}'::jsonb, true)
                """
            ),
            {
                "id": layer_id, "tenant": ids["tenant"], "code": code, "name": name,
                "kind": kind, "cls": cls, "purpose": purpose,
            },
        )

    # Gevra lease boundary, roughly 4 km across.
    geometry_id = new_id("governed_geometry")
    await conn.execute(
        text(
            """
            INSERT INTO governed_geometry
              (id, tenant_id, layer_definition_id, purpose, target_type, mine_id, code, name)
            VALUES (:id, :tenant, :layer, 'LEASE_BOUNDARY', 'MINE', :mine, 'GEVRA-LEASE',
                    'Gevra lease boundary')
            """
        ),
        {
            "id": geometry_id, "tenant": ids["tenant"], "layer": layers["LEASE"],
            "mine": ids["mines"]["GEVRA"],
        },
    )
    await conn.execute(
        text(
            """
            INSERT INTO governed_geometry_version
              (id, governed_geometry_id, version_no, source_geometry, normalized_geometry,
               dimensionality, accuracy_m, capture_method, effective_from, status,
               published_at, row_version)
            VALUES (:id, :gg, 1, '{"note":"seeded"}'::jsonb,
                    ST_SetSRID(ST_GeomFromText(
                      'MULTIPOLYGON(((82.570 22.355, 82.615 22.355, 82.615 22.390,
                                      82.570 22.390, 82.570 22.355)))'), 4326)::geography,
                    '2D', 5.0, 'SEEDED', :from, 'PUBLISHED', :from, 1)
            """
        ),
        {"id": new_id("governed_geometry_version"), "gg": geometry_id, "from": NOW - timedelta(days=300)},
    )

    # The haul-road geofence. The far capture sits ~850 m outside this.
    fence_id = new_id("governed_geometry")
    await conn.execute(
        text(
            """
            INSERT INTO governed_geometry
              (id, tenant_id, layer_definition_id, purpose, target_type, mine_id, asset_id,
               code, name)
            VALUES (:id, :tenant, :layer, 'EVIDENCE_GEOFENCE', 'ASSET', :mine, :asset,
                    'HR-EAST-FENCE', 'East haul road geofence')
            """
        ),
        {
            "id": fence_id, "tenant": ids["tenant"], "layer": layers["GEOFENCE"],
            "mine": ids["mines"]["GEVRA"], "asset": ids["asset"],
        },
    )
    await conn.execute(
        text(
            """
            INSERT INTO governed_geometry_version
              (id, governed_geometry_id, version_no, source_geometry, normalized_geometry,
               dimensionality, accuracy_m, capture_method, effective_from, status,
               published_at, row_version)
            VALUES (:id, :gg, 1, '{"note":"seeded 100m buffer"}'::jsonb,
                    ST_Buffer(
                      ST_SetSRID(ST_MakePoint(82.5931, 22.3731), 4326)::geography, 100
                    ),
                    '2D', 5.0, 'SEEDED', :from, 'PUBLISHED', :from, 1)
            """
        ),
        {"id": new_id("governed_geometry_version"), "gg": fence_id, "from": NOW - timedelta(days=300)},
    )

    await conn.execute(
        text(
            """
            INSERT INTO map_composition_version
              (id, tenant_id, code, version_no, title, mine_id, layer_manifest, filters,
               style, projection, status, published_at, row_version)
            VALUES (:id, :tenant, 'GEVRA-OPS', 1, 'Gevra operational map', :mine,
                    CAST(:manifest AS jsonb), '{}'::jsonb, '{}'::jsonb, 'EPSG:3857',
                    'PUBLISHED', :now, 1)
            """
        ),
        {
            "id": new_id("map_composition_version"),
            "tenant": ids["tenant"],
            "mine": ids["mines"]["GEVRA"],
            "manifest": '[{"layer_code":"LEASE","versions":"current"},'
            '{"layer_code":"GEOFENCE","versions":"current"}]',
            "now": NOW,
        },
    )


async def seed_documents(conn, ids: dict) -> None:  # noqa: ANN001
    print("documents: EC letter, clause segments, extractions, obligations…")

    document_id = new_id("document")
    ids["document"] = document_id
    await conn.execute(
        text(
            """
            INSERT INTO document
              (id, tenant_id, mine_id, doc_class, title, original_filename,
               issuing_authority_id, content_hash, storage_bucket, storage_key,
               byte_size, content_type, status, uploaded_by_principal_id,
               version_no, published_at, row_version)
            VALUES (:id, :tenant, :mine, 'EC_COMPLIANCE_REPORT',
                    'Environmental Clearance — Gevra expansion to 52 MTPA',
                    'gevra-ec-2024.pdf', NULL, :hash, 'strata-originals',
                    :key, 184213, 'application/pdf', 'PUBLISHED', :principal, 1, :now, 1)
            """
        ),
        {
            "id": document_id,
            "tenant": ids["tenant"],
            "mine": ids["mines"]["GEVRA"],
            "hash": "9f2c" + "0" * 60,
            "key": "sha256/9f2c" + "0" * 60,
            "principal": ids["people"]["compliance@strata.demo"]["principal"],
            "now": NOW - timedelta(days=120),
        },
    )

    clauses = [
        (
            "cond_17__a",
            "Ambient air quality monitoring shall be carried out at four locations "
            "within the lease area and results submitted to the Regional Office on a "
            "monthly basis.",
        ),
        (
            "cond_17__b",
            "A minimum berm height of 1.5 metres shall be maintained along all haul "
            "roads and the same shall be inspected weekly.",
        ),
        (
            "cond_22",
            "Half-yearly compliance reports shall be submitted to the Regional Office "
            "by 1 June and 1 December each year.",
        ),
    ]
    segment_ids = []
    for index, (ref, body) in enumerate(clauses, start=1):
        segment_id = new_id("document_segment")
        segment_ids.append(segment_id)
        await conn.execute(
            text(
                """
                INSERT INTO document_segment
                  (id, document_id, segment_ref, sequence_no, text, text_hash, page_no, bbox)
                VALUES (:id, :doc, :ref, :seq, :text, :hash, :page, CAST(:bbox AS jsonb))
                """
            ),
            {
                "id": segment_id, "doc": document_id,
                "ref": f"/akn/in/act/ec/2024/gevra/main#{ref}",
                "seq": index, "text": body,
                "hash": f"sha256:{ref}", "page": index + 2,
                # Bound rather than inlined: a bare `:72` inside a SQL string
                # literal is read as a bind parameter by SQLAlchemy's parser.
                "bbox": '{"x": 72, "y": 180, "width": 468, "height": 48}',
            },
        )

    obligation_specs = [
        ("Monthly ambient air quality monitoring", "MONTHLY", "OFFSET_FROM_PERIOD_END", "SIGNIFICANT", 0),
        ("Weekly haul road berm inspection", "MONTHLY", "END_OF_PERIOD", "SEVERE", 1),
        ("Half-yearly EC compliance report", "SIX_MONTHLY", "FIXED_DATES", "SIGNIFICANT", 2),
    ]
    ids["obligations"] = []
    for title, periodicity, due_rule, severity, segment_index in obligation_specs:
        obligation_id = new_id("obligation")
        ids["obligations"].append(obligation_id)
        await conn.execute(
            text(
                """
                INSERT INTO obligation
                  (id, tenant_id, source_document_id, source_segment_id, shared_obligation_id,
                   clause_ref, deontic, title, summary, periodicity, due_rule_kind,
                   due_rule_detail, grace_period_days, source_scope, severity, nil_permitted,
                   active, version_no, published_at, row_version)
                VALUES (:id, :tenant, :doc, :seg, :shared, :clause, 'OBLIGATION', :title,
                        :summary, :periodicity, :due_rule, '{"offset_days": 7}'::jsonb,
                        7, 'MINE', :severity, false, true, 1, :now, 1)
                """
            ),
            {
                "id": obligation_id, "tenant": ids["tenant"], "doc": document_id,
                "seg": segment_ids[segment_index], "shared": new_id("obligation"),
                "clause": clauses[segment_index][0], "title": title,
                "summary": clauses[segment_index][1][:200],
                "periodicity": periodicity, "due_rule": due_rule,
                "severity": severity, "now": NOW - timedelta(days=120),
            },
        )
        await conn.execute(
            text(
                """
                INSERT INTO obligation_applicability_rule (id, obligation_id, kind, detail)
                VALUES (:id, :ob, 'MINE_TYPE', '{"mine_type": "OPENCAST"}'::jsonb)
                """
            ),
            {"id": new_id("obligation"), "ob": obligation_id},
        )

    # Instances spread across the statuses a dashboard has to distinguish, so
    # the four measures return meaningfully different numbers.
    statuses = [
        ("SATISFIED", -90, None), ("SATISFIED", -60, None),
        ("SATISFIED", -30, None), ("SUBMITTED", -10, None),
        ("OVERDUE", -20, None), ("OVERDUE", -45, "CLAIMED_UNSUPPORTED"),
        ("DUE", 0, None), ("UPCOMING", 20, None),
        ("EVIDENCE_MISMATCH", -15, None), ("NOT_APPLICABLE", -75, None),
    ]
    ids["instances"] = []
    for index, (status, day_offset, reconciliation) in enumerate(statuses):
        instance_id = new_id("obligation_instance")
        ids["instances"].append(instance_id)
        due = date.today() + timedelta(days=day_offset)
        await conn.execute(
            text(
                """
                INSERT INTO obligation_instance
                  (id, tenant_id, obligation_id, mine_id, period_start, period_end, due_on,
                   status, status_reason, reconciliation, row_version)
                VALUES (:id, :tenant, :ob, :mine, :ps, :pe, :due, :status, :reason, :rec, 1)
                """
            ),
            {
                "id": instance_id, "tenant": ids["tenant"],
                "ob": ids["obligations"][index % 3],
                "mine": ids["mines"]["GEVRA"],
                "ps": due - timedelta(days=30), "pe": due, "due": due,
                "status": status,
                "reason": "Monitoring station not commissioned this period"
                if status == "NOT_APPLICABLE"
                else None,
                "rec": reconciliation,
            },
        )

    # Proposals still in the review queue — the screen the demo opens on.
    proposals = [
        ("Quarterly groundwater quality monitoring at three piezometers", 0.91, 0),
        ("Berm height shall not be less than 1.5 m on haul roads", 0.87, 1),
        ("Annual green belt survival audit by a third party", 0.42, 2),
        ("Submit half-yearly report by 1 June and 1 December", 0.95, 2),
    ]
    for title, confidence, segment_index in proposals:
        await conn.execute(
            text(
                """
                INSERT INTO extraction
                  (id, tenant_id, document_id, segment_id, extractor, extraction_type,
                   payload, anchor, confidence, status, row_version)
                VALUES (:id, :tenant, :doc, :seg, 'obligation@v3', 'OBLIGATION',
                        CAST(:payload AS jsonb), :anchor, :conf, 'PROPOSED', 1)
                """
            ),
            {
                "id": new_id("extraction"), "tenant": ids["tenant"], "doc": document_id,
                "seg": segment_ids[segment_index],
                "payload": '{"title": "' + title.replace('"', "'") + '", '
                '"periodicity": "QUARTERLY", "due_rule_kind": "END_OF_PERIOD", '
                '"severity": "SIGNIFICANT", "source_scope": "MINE"}',
                "anchor": title[:80], "conf": confidence,
            },
        )

    # A real contradiction: the EC says weekly, a DGMS circular says fortnightly.
    await conn.execute(
        text(
            """
            INSERT INTO obligation_conflict
              (id, tenant_id, conflict_type, obligation_a_id, obligation_b_id, detail,
               status, detected_at, row_version)
            VALUES (:id, :tenant, 'CONFLICTING_FREQUENCY', :a, :b,
                    CAST(:detail AS jsonb), 'OPEN', :now, 1)
            """
        ),
        {
            "id": new_id("obligation_conflict"), "tenant": ids["tenant"],
            "a": ids["obligations"][1], "b": ids["obligations"][2],
            "detail": '{"a_frequency": "WEEKLY", "b_frequency": "FORTNIGHTLY", '
            '"note": "EC condition 17(b) and the DGMS circular disagree on '
            'haul road inspection frequency"}',
            "now": NOW - timedelta(days=3),
        },
    )


async def seed_defect_pipeline(conn, ids: dict) -> None:  # noqa: ANN001
    print("defects: a recurring berm defect, its finding and two CAPAs…")

    defect_id = new_id("defect")
    ids["defect"] = defect_id
    await conn.execute(
        text(
            """
            INSERT INTO defect
              (id, tenant_id, mine_id, at_asset_id, title, description, status,
               current_severity, first_observed_on, recurrence_count, last_recurred_at,
               row_version)
            VALUES (:id, :tenant, :mine, :asset,
                    'Berm missing on east haul road',
                    'Berm height below 1.5 m for approximately 120 m of the east haul '
                    'road near the ramp. Previously closed in March and recurred.',
                    'RECURRED', 'SEVERE', :first, 2, :last, 1)
            """
        ),
        {
            "id": defect_id, "tenant": ids["tenant"], "mine": ids["mines"]["GEVRA"],
            "asset": ids["asset"],
            # An old anchor date is the point: ageing reads from first sighting,
            # not from the most recent recurrence.
            "first": date.today() - timedelta(days=104),
            "last": NOW - timedelta(days=12),
        },
    )

    await conn.execute(
        text(
            """
            INSERT INTO observation
              (id, tenant_id, mine_id, source_type, reported_by_person_id, at_asset_id,
               description, raised_severity, normalised_severity, observed_at,
               location, matched_defect_id, match_decision, match_decision_by_person_id,
               match_decision_at, row_version)
            VALUES (:id, :tenant, :mine, 'FIELD_ENTRY', :person, :asset,
                    'Berm again below required height near ramp on east haul road',
                    'SEVERE', 'SEVERE', :observed,
                    ST_SetSRID(ST_MakePoint(82.5932, 22.3730), 4326)::geography,
                    :defect, 'MATCHED_EXISTING', :person, :decided, 1)
            """
        ),
        {
            "id": new_id("observation"), "tenant": ids["tenant"],
            "mine": ids["mines"]["GEVRA"], "asset": ids["asset"],
            "person": ids["people"]["safety@strata.demo"]["person"],
            "observed": NOW - timedelta(days=12), "defect": defect_id,
            "decided": NOW - timedelta(days=12),
        },
    )

    # A pending observation, so the match-decision screen has something to do.
    await conn.execute(
        text(
            """
            INSERT INTO observation
              (id, tenant_id, mine_id, source_type, reported_by_person_id,
               description, raised_severity, normalised_severity, observed_at,
               location, match_decision, row_version)
            VALUES (:id, :tenant, :mine, 'FIELD_ENTRY', :person,
                    'Water accumulation at the toe of dump 3 after overnight rain',
                    'SIGNIFICANT', 'SIGNIFICANT', :observed,
                    ST_SetSRID(ST_MakePoint(82.5880, 22.3690), 4326)::geography,
                    'PENDING', 1)
            """
        ),
        {
            "id": new_id("observation"), "tenant": ids["tenant"],
            "mine": ids["mines"]["GEVRA"],
            "person": ids["people"]["safety@strata.demo"]["person"],
            "observed": NOW - timedelta(days=2),
        },
    )

    finding_id = new_id("finding")
    ids["finding"] = finding_id
    await conn.execute(
        text(
            """
            INSERT INTO finding
              (id, tenant_id, mine_id, defect_id, requirement_obligation_id, severity,
               raised_by_person_id, status, row_version)
            VALUES (:id, :tenant, :mine, :defect, :ob, 'SEVERE', :person,
                    'PENDING_VERIFICATION', 1)
            """
        ),
        {
            "id": finding_id, "tenant": ids["tenant"], "mine": ids["mines"]["GEVRA"],
            "defect": defect_id, "ob": ids["obligations"][1],
            "person": ids["people"]["safety@strata.demo"]["person"],
        },
    )

    # The CAPA the demo tries to close. Submitted, awaiting verification —
    # and the evidence behind it is the wrong evidence.
    capa_id = new_id("capa")
    ids["capa"] = capa_id
    await conn.execute(
        text(
            """
            INSERT INTO capa
              (id, tenant_id, finding_id, mine_id, corrective_action, preventive_action,
               assigned_to_person_id, assigned_at, due_on, status,
               submitted_by_person_id, submitted_at, extension_count,
               last_extension_reason, last_extended_at, row_version)
            VALUES (:id, :tenant, :finding, :mine,
                    'Reinstate berm to 1.5 m along the affected 120 m section.',
                    'Add the east haul road to the weekly supervisor walkover checklist '
                    'and brief the shift in-charge on berm standards.',
                    :assignee, :assigned, :due, 'SUBMITTED', :assignee, :submitted,
                    2, 'Monsoon delayed the dozer availability', :extended, 3)
            """
        ),
        {
            "id": capa_id, "tenant": ids["tenant"], "finding": finding_id,
            "mine": ids["mines"]["GEVRA"],
            "assignee": ids["people"]["safety@strata.demo"]["person"],
            "assigned": NOW - timedelta(days=10),
            "due": date.today() + timedelta(days=3),
            "submitted": NOW - timedelta(hours=6),
            "extended": NOW - timedelta(days=4),
        },
    )

    # A second, already-closed CAPA on an older finding: this is what the
    # effectiveness signal points at, since the defect recurred anyway.
    old_finding_id = new_id("finding")
    await conn.execute(
        text(
            """
            INSERT INTO finding
              (id, tenant_id, mine_id, defect_id, requirement_obligation_id, severity,
               raised_by_person_id, status, row_version)
            VALUES (:id, :tenant, :mine, :defect, :ob, 'SEVERE', :person, 'CLOSED', 2)
            """
        ),
        {
            "id": old_finding_id, "tenant": ids["tenant"], "mine": ids["mines"]["GEVRA"],
            "defect": defect_id, "ob": ids["obligations"][1],
            "person": ids["people"]["safety@strata.demo"]["person"],
        },
    )
    await conn.execute(
        text(
            """
            INSERT INTO capa
              (id, tenant_id, finding_id, mine_id, corrective_action, preventive_action,
               assigned_to_person_id, due_on, status, submitted_by_person_id, submitted_at,
               verified_by_person_id, verified_at, extension_count, row_version)
            VALUES (:id, :tenant, :finding, :mine,
                    'Rebuild berm on the east haul road.',
                    'Toolbox talk on berm maintenance.',
                    :assignee, :due, 'VERIFIED_CLOSED', :assignee, :submitted,
                    :verifier, :verified, 0, 4)
            """
        ),
        {
            "id": new_id("capa"), "tenant": ids["tenant"], "finding": old_finding_id,
            "mine": ids["mines"]["GEVRA"],
            "assignee": ids["people"]["safety@strata.demo"]["person"],
            "due": date.today() - timedelta(days=70),
            "submitted": NOW - timedelta(days=75),
            "verifier": ids["people"]["manager@strata.demo"]["person"],
            "verified": NOW - timedelta(days=72),
        },
    )


async def seed_evidence(conn, ids: dict) -> None:  # noqa: ANN001
    print("evidence: one capture inside the geofence, one 847 m outside…")

    device = "device_pixel_7a_field01"
    captures = [
        # The wrong one. Same CAPA, but taken at the workshop rather than at
        # the berm — this is what the gate blocks and explains.
        (
            "far",
            82.6015,
            22.3690,
            "VERIFIED",
            NOW - timedelta(hours=7),
            1,
            None,
        ),
        # The right one, kept unlinked so the demo can attach it after the
        # block and watch the same action succeed.
        (
            "near",
            82.59315,
            22.37312,
            "VERIFIED",
            NOW - timedelta(hours=2),
            2,
            "sha256:evidence-far",
        ),
    ]

    ids["evidence"] = {}
    for label, lon, lat, verdict, captured_at, sequence, prev_hash in captures:
        evidence_id = new_id("evidence")
        ids["evidence"][label] = evidence_id
        await conn.execute(
            text(
                """
                INSERT INTO evidence
                  (id, tenant_id, mine_id, captured_by_person_id, for_capa_id,
                   capture_path, media_type, content_hash, storage_bucket, storage_key,
                   byte_size, content_type, client_schema_version, device_id,
                   chain_sequence, prev_hash, location, location_accuracy_m,
                   location_provider, satellites_used, is_mock_location,
                   captured_at_wall, captured_at_monotonic_ns, server_received_at,
                   verdict, verdict_reasons, at_asset_id, synced_at, row_version)
                VALUES (:id, :tenant, :mine, :person, :capa, 'DIRECT', 'PHOTO',
                        :hash, 'strata-originals', :key, 2384112, 'image/jpeg', 1,
                        :device, :seq, :prev,
                        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                        4.5, 'GPS', 11, false, :captured, 184320000000, :received,
                        :verdict, '[]'::jsonb, :asset, :received, 1)
                """
            ),
            {
                "id": evidence_id, "tenant": ids["tenant"], "mine": ids["mines"]["GEVRA"],
                "person": ids["people"]["safety@strata.demo"]["person"],
                # Both point at the CAPA: the gate's job is to notice that one
                # of them is nowhere near the thing it claims to evidence.
                "capa": ids["capa"] if label == "far" else None,
                "hash": f"sha256:evidence-{label}",
                "key": f"sha256/evidence-{label}",
                "device": device, "seq": sequence, "prev": prev_hash,
                "lon": lon, "lat": lat, "captured": captured_at,
                "received": captured_at + timedelta(minutes=20),
                "verdict": verdict, "asset": ids["asset"],
            },
        )


async def seed_inspections(conn, ids: dict) -> None:  # noqa: ANN001
    print("inspections: a type catalogue, a scheduled inspection, an offered place…")

    type_id = new_id("inspection_type")
    await conn.execute(
        text(
            "INSERT INTO inspection_type (id, code, name, active) "
            "VALUES (:id, 'STATUTORY_SAFETY', 'Statutory safety inspection', true)"
        ),
        {"id": type_id},
    )

    template_id = new_id("checklist_template_version")
    await conn.execute(
        text(
            """
            INSERT INTO checklist_template_version
              (id, code, version_no, title, status, published_at)
            VALUES (:id, 'SAFETY_WALKOVER', 1, 'Safety walkover checklist', 'PUBLISHED', :now)
            """
        ),
        {"id": template_id, "now": NOW - timedelta(days=200)},
    )
    for index, item in enumerate(
        [
            "Berm height on all active haul roads is at least 1.5 m",
            "Dump slope angle is within the approved plan",
            "Illumination at the loading face meets the standard",
            "Emergency assembly point signage is legible and unobstructed",
        ],
        start=1,
    ):
        await conn.execute(
            text(
                """
                INSERT INTO checklist_template_item
                  (id, template_version_id, sequence_no, text, mandatory)
                VALUES (:id, :tpl, :seq, :text, true)
                """
            ),
            {"id": new_id("checklist_template_item"), "tpl": template_id, "seq": index, "text": item},
        )

    version_id = new_id("inspection_type_version")
    ids["inspection_type_version"] = version_id
    await conn.execute(
        text(
            """
            INSERT INTO inspection_type_version
              (id, inspection_type_id, version_no, allowed_origins,
               checklist_template_version_id, workflow_policy, report_policy,
               closure_policy, effective_from)
            VALUES (:id, :type, 1, ARRAY['INTERNAL','REGULATORY']::inspection_origin[],
                    :tpl, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, :from)
            """
        ),
        {"id": version_id, "type": type_id, "tpl": template_id, "from": NOW - timedelta(days=200)},
    )

    inspection_id = new_id("inspection")
    ids["inspection"] = inspection_id
    await conn.execute(
        text(
            """
            INSERT INTO inspection
              (id, tenant_id, inspection_type_version_id, origin, creation_mode, status,
               title, purpose_code, scheduled_from, scheduled_until,
               created_by_principal_id, row_version)
            VALUES (:id, :tenant, :ver, 'INTERNAL', 'PLANNED', 'ASSIGNED',
                    'Q3 statutory safety inspection — Gevra OCP', 'ROUTINE_INSPECTION',
                    :from, :until, :principal, 1)
            """
        ),
        {
            "id": inspection_id, "tenant": ids["tenant"], "ver": version_id,
            "from": NOW + timedelta(days=2), "until": NOW + timedelta(days=3),
            "principal": ids["people"]["manager@strata.demo"]["principal"],
        },
    )
    await conn.execute(
        text(
            """
            INSERT INTO inspection_target
              (id, inspection_id, target_type, mine_id, asset_id, purpose, valid_from)
            VALUES (:id, :insp, 'ASSET', :mine, :asset, 'Berm compliance', :now)
            """
        ),
        {
            "id": new_id("inspection_target"), "insp": inspection_id,
            "mine": ids["mines"]["GEVRA"], "asset": ids["asset"], "now": NOW,
        },
    )

    assignment_id = new_id("inspection_assignment_version")
    await conn.execute(
        text(
            """
            INSERT INTO inspection_assignment_version
              (id, inspection_id, version_no, status, effective_from)
            VALUES (:id, :insp, 1, 'ACTIVE', :now)
            """
        ),
        {"id": assignment_id, "insp": inspection_id, "now": NOW},
    )

    # One accepted lead and one still-offered member: the mobile app's first
    # screen is exactly this pending offer.
    for person_email, role, status in [
        ("safety@strata.demo", "LEAD", "ACCEPTED"),
        ("inspector@strata.demo", "MEMBER", "OFFERED"),
    ]:
        member_id = new_id("inspection_assignment_member")
        await conn.execute(
            text(
                """
                INSERT INTO inspection_assignment_member
                  (id, assignment_version_id, person_id, appointment_id, participation_role,
                   assignment_status, offered_at, accepted_at)
                VALUES (:id, :av, :person, :appt, :role, :status, :offered, :accepted)
                """
            ),
            {
                "id": member_id, "av": assignment_id,
                "person": ids["people"][person_email]["person"],
                "appt": ids["people"][person_email]["appointment"],
                "role": role, "status": status,
                "offered": NOW - timedelta(days=1),
                "accepted": NOW - timedelta(hours=20) if status == "ACCEPTED" else None,
            },
        )
        if role == "LEAD":
            await conn.execute(
                text("UPDATE inspection SET lead_assignment_member_id = :m WHERE id = :i"),
                {"m": member_id, "i": inspection_id},
            )

    visit_id = new_id("inspection_visit")
    await conn.execute(
        text(
            """
            INSERT INTO inspection_visit
              (id, inspection_id, visit_number, status, planned_from, planned_until,
               row_version)
            VALUES (:id, :insp, 1, 'PLANNED', :from, :until, 1)
            """
        ),
        {
            "id": visit_id, "insp": inspection_id,
            "from": NOW + timedelta(days=2), "until": NOW + timedelta(days=2, hours=6),
        },
    )

    instance_id = new_id("inspection_checklist_instance")
    await conn.execute(
        text(
            """
            INSERT INTO inspection_checklist_instance
              (id, inspection_id, template_version_id, frozen_at)
            VALUES (:id, :insp, :tpl, :now)
            """
        ),
        {"id": instance_id, "insp": inspection_id, "tpl": template_id, "now": NOW},
    )
    template_items = (
        await conn.execute(
            text(
                "SELECT id, sequence_no FROM checklist_template_item "
                "WHERE template_version_id = :tpl ORDER BY sequence_no"
            ),
            {"tpl": template_id},
        )
    ).mappings().all()
    for item in template_items:
        await conn.execute(
            text(
                """
                INSERT INTO inspection_checklist_item
                  (id, instance_id, source_item_version_id, sequence_no, mandatory)
                VALUES (:id, :inst, :src, :seq, true)
                """
            ),
            {
                "id": new_id("inspection_checklist_item"), "inst": instance_id,
                "src": item["id"], "seq": item["sequence_no"],
            },
        )


async def seed_analytics(conn, ids: dict) -> None:  # noqa: ANN001
    print("analytics: governance chain and three signals with real lineage…")

    provider_id = new_id("ai_provider_profile")
    await conn.execute(
        text(
            """
            INSERT INTO ai_provider_profile
              (id, code, name, provider, deployment, data_retention_terms,
               approved_classifications, active)
            VALUES (:id, 'GEMINI_API', 'Google Gemini API', 'google', 'API',
                    '{"retention_days": 0, "trains_on_data": false}'::jsonb,
                    ARRAY['INTERNAL'], true)
            """
        ),
        {"id": provider_id},
    )

    model_id = new_id("ai_model")
    model_version_id = new_id("ai_model_version")
    await conn.execute(
        text(
            "INSERT INTO ai_model (id, code, name, model_type) "
            "VALUES (:id, 'RULE_RISK_V1', 'Deterministic risk scorer', 'RULE')"
        ),
        {"id": model_id},
    )
    await conn.execute(
        text(
            """
            INSERT INTO ai_model_version
              (id, ai_model_id, version_no, provider_profile_id, provider_model_id,
               algorithm, config, content_hash, status)
            VALUES (:id, :model, 1, :provider, 'gemini-2.5-pro', 'weighted_rule',
                    '{"weights": {"recurrence": 0.4, "ageing": 0.3, "severity": 0.3}}'::jsonb,
                    'sha256:model-v1', 'ACTIVE')
            """
        ),
        {"id": model_version_id, "model": model_id, "provider": provider_id},
    )

    prompt_id = new_id("ai_prompt_template_version")
    await conn.execute(
        text(
            """
            INSERT INTO ai_prompt_template_version
              (id, code, version_no, system_template, user_template, tools,
               retrieval_policy, safety_controls, content_hash, status)
            VALUES (:id, 'RISK_EXPLANATION', 1,
                    'You explain a risk score that has already been computed. '
                    'You never change the score.',
                    'Explain why {subject} scored {score} given {factors}.',
                    '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, 'sha256:prompt-v1', 'ACTIVE')
            """
        ),
        {"id": prompt_id},
    )

    use_cases = {}
    for code, name, purpose in [
        ("RISK_DETECTION", "AI Risk Detection", "Surface defects likely to become incidents"),
        ("CAPA_EFFECTIVENESS", "CAPA Effectiveness", "Detect closed CAPAs that did not work"),
        ("REG_CHANGE_IMPACT", "Regulatory Change Impact", "Assess which obligations a new rule touches"),
    ]:
        use_case_id = new_id("ai_use_case")
        version_id = new_id("ai_use_case_version")
        use_cases[code] = version_id
        await conn.execute(
            text("INSERT INTO ai_use_case (id, code, name) VALUES (:id, :code, :name)"),
            {"id": use_case_id, "code": code, "name": name},
        )
        await conn.execute(
            text(
                """
                INSERT INTO ai_use_case_version
                  (id, use_case_id, version_no, purpose, decision_influence, risk_tier,
                   intended_use, excluded_use, human_workflow, fallback, status,
                   approved_at, effective_from, row_version)
                VALUES (:id, :uc, 1, :purpose, 'ADVISORY', 'LIMITED',
                        'Prioritise human attention',
                        'Never to close, waive or auto-approve any record',
                        'A qualified person reviews every signal and records a disposition',
                        'The register and dashboards work unchanged with no signals',
                        'ACTIVE', :now, :now, 1)
                """
            ),
            {"id": version_id, "uc": use_case_id, "purpose": purpose, "now": NOW - timedelta(days=60)},
        )

    deployment_id = new_id("ai_deployment")
    await conn.execute(
        text(
            """
            INSERT INTO ai_deployment
              (id, code, use_case_version_id, model_version_id, prompt_template_version_id,
               provider_profile_id, environment, traffic_mode, thresholds, fallback,
               status, activated_at, row_version)
            VALUES (:id, 'RISK_PROD', :ucv, :mv, :pv, :prov, 'production', 'FULL',
                    '{"emit_above": 0.6}'::jsonb, 'no signals emitted', 'ACTIVE', :now, 1)
            """
        ),
        {
            "id": deployment_id, "ucv": use_cases["RISK_DETECTION"], "mv": model_version_id,
            "pv": prompt_id, "prov": provider_id, "now": NOW - timedelta(days=60),
        },
    )

    signals = [
        (
            "DEFECT_RISK", "AI Risk Detection", "RISK_DETECTION",
            "defect", ids["defect"], 0.87, "SEVERE",
            "This defect has recurred twice, is 104 days past first sighting and sits in "
            "the CRITICAL ageing band for a SEVERE condition. Recurrence after a verified "
            "closure is the strongest single predictor in the rule set.",
        ),
        (
            "CAPA_INEFFECTIVE", "CAPA Effectiveness", "CAPA_EFFECTIVENESS",
            "capa", ids["capa"], 0.79, "SIGNIFICANT",
            "A CAPA on this defect reached VERIFIED_CLOSED 72 days ago and the same "
            "condition was observed again 12 days ago. The preventive action was a "
            "toolbox talk with no recurring check attached.",
        ),
        (
            "REG_CHANGE_IMPACT", "Regulatory Change Impact", "REG_CHANGE_IMPACT",
            "obligation", ids["obligations"][1], 0.68, "SIGNIFICANT",
            "A newly extracted clause sets haul-road inspection frequency at a different "
            "interval from the published obligation. Three mines and eleven open periods "
            "reference the existing frequency.",
        ),
    ]

    for code, name, use_case_code, subject_type, subject_id, score, severity, explanation in signals:
        definition_id = new_id("signal_definition")
        version_id = new_id("signal_definition_version")
        await conn.execute(
            text("INSERT INTO signal_definition (id, code, name) VALUES (:id, :code, :name)"),
            {"id": definition_id, "code": code, "name": name},
        )
        await conn.execute(
            text(
                """
                INSERT INTO signal_definition_version
                  (id, signal_definition_id, version_no, eligible_population, trigger_rule,
                   deployment_id, semantics, threshold, severity_map, recipients,
                   suppression, response_contract, status, effective_from, row_version)
                VALUES (:id, :def, 1, '{"status": ["OPEN","RECURRED","UNDER_ACTION"]}'::jsonb,
                        '{"kind": "weighted_rule"}'::jsonb, :dep, :semantics,
                        '{"emit_above": 0.6}'::jsonb, '{"0.8": "SEVERE"}'::jsonb,
                        '{"position_templates": ["MINE_MANAGER","SAFETY_OFFICER"]}'::jsonb,
                        '{"dedup_window_days": 7}'::jsonb,
                        '{"expected": "review and record a disposition"}'::jsonb,
                        'ACTIVE', :now, 1)
                """
            ),
            {
                "id": version_id, "def": definition_id, "dep": deployment_id,
                "semantics": f"{name}: advisory only, never authoritative",
                "now": NOW - timedelta(days=60),
            },
        )

        run_id = new_id("ai_run")
        await conn.execute(
            text(
                """
                INSERT INTO ai_run
                  (id, tenant_id, deployment_id, use_case_version_id, model_version_id,
                   prompt_template_version_id, status, started_at, finished_at,
                   input_manifest, output_manifest, warnings, cost, trace_id)
                VALUES (:id, :tenant, :dep, :ucv, :mv, :pv, 'SUCCEEDED', :started, :finished,
                        CAST(:inputs AS jsonb), CAST(:outputs AS jsonb), '[]'::jsonb,
                        '{"input_tokens": 1840, "output_tokens": 210}'::jsonb, :trace)
                """
            ),
            {
                "id": run_id, "tenant": ids["tenant"], "dep": deployment_id,
                "ucv": use_cases[use_case_code], "mv": model_version_id, "pv": prompt_id,
                "started": NOW - timedelta(hours=8),
                "finished": NOW - timedelta(hours=8) + timedelta(seconds=4),
                "inputs": '[{"object": "' + subject_type + '", "id": "' + subject_id
                + '", "content_hash": "sha256:seeded"}]',
                "outputs": '{"score": ' + str(score) + "}",
                "trace": new_id("ai_run").replace("airun_", "trace_"),
            },
        )

        await conn.execute(
            text(
                """
                INSERT INTO signal_instance
                  (id, tenant_id, signal_definition_version_id, ai_run_id, subject_type,
                   subject_id, mine_id, window_start, window_end, score, category, severity,
                   explanation, grounding_refs, state, emitted_at, row_version)
                VALUES (:id, :tenant, :sdv, :run, :st, :si, :mine, :ws, :we, :score, :cat,
                        :severity, :explanation, CAST(:grounding AS jsonb), 'ACTIVE', :now, 1)
                """
            ),
            {
                "id": new_id("signal_instance"), "tenant": ids["tenant"], "sdv": version_id,
                "run": run_id, "st": subject_type, "si": subject_id,
                "mine": ids["mines"]["GEVRA"],
                "ws": NOW - timedelta(days=90), "we": NOW,
                "score": score, "cat": code, "severity": severity,
                "explanation": explanation,
                "grounding": '[{"object": "' + subject_type + '", "id": "' + subject_id
                + '", "content_hash": "sha256:seeded"}]',
                "now": NOW - timedelta(hours=8),
            },
        )

    for metric_key, title in [
        ("verified_compliance_rate", "Verified compliance rate"),
        ("submission_rate", "Submission rate"),
        ("overdue_load", "Overdue load"),
        ("unsupported_claim_load", "Unsupported claim load"),
        ("capa_effectiveness", "CAPA effectiveness"),
    ]:
        await conn.execute(
            text(
                """
                INSERT INTO metric_version
                  (id, metric_key, version_no, title, definition, owner, effective_from)
                VALUES (:id, :key, 1, :title, CAST(:definition AS jsonb), 'compliance', :now)
                """
            ),
            {
                "id": new_id("metric_version"), "key": metric_key, "title": title,
                "definition": '{"excludes": ["NOT_APPLICABLE", "WAIVED"], '
                '"zero_denominator": "null, rendered as an em-dash"}',
                "now": NOW - timedelta(days=200),
            },
        )


async def seed_enums(conn) -> None:  # noqa: ANN001
    print("enums: labels and colours so clients never hardcode them…")

    registry = {
        "severity": [
            ("MINOR", "Minor", 1, "#6B7280"),
            ("SIGNIFICANT", "Significant", 2, "#B45309"),
            ("SEVERE", "Severe", 3, "#B91C1C"),
        ],
        "capa_status": [
            ("OPEN", "Open", 1, "#6B7280"),
            ("IN_PROGRESS", "In progress", 2, "#1D4ED8"),
            ("SUBMITTED", "Submitted", 3, "#B45309"),
            ("VERIFIED_CLOSED", "Verified closed", 4, "#15803D"),
            ("REOPENED", "Reopened", 5, "#B91C1C"),
        ],
        "instance_status": [
            ("UPCOMING", "Upcoming", 1, "#6B7280"),
            ("DUE", "Due", 2, "#B45309"),
            ("SUBMITTED", "Submitted", 3, "#1D4ED8"),
            ("SATISFIED", "Satisfied", 4, "#15803D"),
            ("EVIDENCE_MISMATCH", "Evidence mismatch", 5, "#B91C1C"),
            ("OVERDUE", "Overdue", 6, "#B91C1C"),
            ("ESCALATED", "Escalated", 7, "#7F1D1D"),
            ("NOT_APPLICABLE", "Not applicable", 8, "#9CA3AF"),
            ("WAIVED", "Waived", 9, "#9CA3AF"),
        ],
        "evidence_verdict": [
            ("VERIFIED", "Verified", 1, "#15803D"),
            ("PLAUSIBLE", "Plausible", 2, "#65A30D"),
            ("UNVERIFIED", "Unverified", 3, "#B45309"),
            ("SUSPECT", "Suspect", 4, "#B91C1C"),
        ],
        "verification_outcome": [
            ("ACCEPTED", "Accepted", 1, "#15803D"),
            ("ACCEPTED_WITH_OVERRIDE", "Accepted with override", 2, "#B45309"),
            ("BLOCKED_DISTANCE_MISMATCH", "Blocked — captured away from target", 3, "#B91C1C"),
            ("BLOCKED_ALL_UNVERIFIED", "Blocked — no verifiable evidence", 4, "#B91C1C"),
            ("BLOCKED_SUSPECT_EVIDENCE", "Blocked — suspect capture", 5, "#B91C1C"),
            ("BLOCKED_SELF_VERIFICATION", "Blocked — verifier is the submitter", 6, "#B91C1C"),
        ],
    }

    for enum_name, values in registry.items():
        for value, label, ordering, color in values:
            await conn.execute(
                text(
                    """
                    INSERT INTO enum_registry
                      (id, enum_name, value, label, label_i18n, ordering, color, deprecated)
                    VALUES (:id, :enum, :value, :label, CAST(:i18n AS jsonb), :ord, :color, false)
                    """
                ),
                {
                    "id": new_id("enum_registry"), "enum": enum_name, "value": value,
                    "label": label,
                    "i18n": '{"en": "' + label + '"}',
                    "ord": ordering, "color": color,
                },
            )


if __name__ == "__main__":
    asyncio.run(main())
