"""ULID identifiers, prefixed per resource type.

Wire format is `<prefix>_<26-char Crockford base32 ULID>`. Clients treat the
whole string as opaque: the prefix and the timestamp component are never
parsed for authorization or business logic.
"""

from ulid import ULID

# One prefix per object type. The registry validates that every registered
# resource has an entry here, so a new collection cannot ship without one.
PREFIXES: dict[str, str] = {
    # kernel
    "operation": "op",
    "idempotency_key": "idem",
    "domain_audit_event": "aud",
    "security_event": "sec",
    "access_event": "acc",
    "outbox_message": "obx",
    "enum_registry": "enum",
    # identity
    "tenant": "ten",
    "organization": "org",
    "organization_unit": "ou",
    "person": "per",
    "principal": "prin",
    "affiliation": "aff",
    "mine": "mine",
    "subunit": "sub",
    "asset": "ast",
    "position_template": "pt",
    "post": "post",
    "appointment": "appt",
    "capability": "cap",
    "regulatory_authority": "auth",
    "authority_unit": "au",
    "mandate": "mnd",
    "mandate_assignment": "mna",
    "jurisdiction_assignment": "jur",
    # documents
    "upload": "upl",
    "document": "doc",
    "document_segment": "seg",
    "extraction": "extr",
    "obligation": "obl",
    "obligation_instance": "oi",
    "obligation_conflict": "ocf",
    "obligation_evidence_link": "oel",
    "nil_return": "nil",
    # defects
    "observation": "obs",
    "defect": "def",
    "finding": "find",
    "capa": "capa",
    # evidence
    "evidence": "ev",
    "evidence_verification_attempt": "eva",
    # inspections
    "inspection_type": "itype",
    "inspection_type_version": "itv",
    "inspection": "insp",
    "inspection_target": "itgt",
    "inspection_visit": "visit",
    "inspection_assignment_version": "iav",
    "inspection_assignment_member": "iam",
    "inspection_response": "iresp",
    "inspection_report": "irep",
    "inspection_decision": "idec",
    "checklist_template_version": "ctv",
    "checklist_template_item": "cti",
    "inspection_checklist_instance": "ici",
    "inspection_checklist_item": "icit",
    # geospatial
    "spatial_layer_definition": "layer",
    "governed_geometry": "geom",
    "governed_geometry_version": "ggv",
    "spatial_policy_version": "spv",
    "spatial_evaluation": "seval",
    "map_composition_version": "map",
    "spatial_reference_system_profile": "srs",
    # workflow / dashboard
    "notification": "notif",
    "notification_delegate": "ndel",
    "metric_version": "mver",
    "metric_manifest": "mman",
    # analytics
    "ai_use_case": "aiuc",
    "ai_use_case_version": "aiucv",
    "ai_model": "aim",
    "ai_model_version": "aimv",
    "ai_prompt_template_version": "aipt",
    "ai_provider_profile": "aipp",
    "ai_deployment": "aidep",
    "ai_run": "airun",
    "signal_definition": "sigdef",
    "signal_definition_version": "sdv",
    "signal_instance": "sig",
    "signal_delivery": "sigd",
    "signal_review": "sigr",
}


def new_id(object_type: str) -> str:
    """Generate a prefixed ULID for an object type."""
    prefix = PREFIXES.get(object_type)
    if prefix is None:
        raise KeyError(f"no ID prefix registered for {object_type!r} — add one to PREFIXES")
    return f"{prefix}_{ULID()}"


def prefix_for(object_type: str) -> str:
    return PREFIXES[object_type]


def looks_like_id(value: str) -> bool:
    """Cheap shape check. Never used for authorization."""
    if "_" not in value:
        return False
    prefix, _, suffix = value.partition("_")
    return prefix in PREFIXES.values() and len(suffix) == 26
