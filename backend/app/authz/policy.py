"""The policy layer: everything the graph cannot answer.

OpenFGA knows who is related to what. It does not know that a verifier may
not be the submitter, that a SEVERE finding needs a higher capability than a
MINOR one, that a regulator-issued finding cannot be closed by operator
authority, or that signing needs step-up assurance. Those live here.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.authz.principal import Principal
from app.core.errors import AssuranceRequired, Forbidden, Unprocessable
from app.core.time import utcnow

# Ordered weakest to strongest. A required level is satisfied by anything at
# or above it.
ASSURANCE_ORDER = ["PASSWORD", "MFA", "PASSKEY", "STEP_UP"]


def assurance_satisfies(held: str, required: str) -> bool:
    try:
        return ASSURANCE_ORDER.index(held) >= ASSURANCE_ORDER.index(required)
    except ValueError:
        return False


async def check_assurance(
    session: AsyncSession, principal: Principal, capability_code: str
) -> None:
    """A high-risk capability can demand step-up even from a valid session."""
    required = (
        await session.execute(
            text("SELECT required_assurance FROM capability WHERE code = :c"),
            {"c": capability_code},
        )
    ).scalar_one_or_none()

    if required is None:
        return
    if not assurance_satisfies(principal.assurance, required):
        raise AssuranceRequired(
            f"{capability_code} requires {required} authentication",
            {"required_assurance": required, "held": principal.assurance},
        )


def check_separation_of_duties(action: str, obj: Any, principal: Principal) -> None:
    """One person cannot be both sides of a control.

    The database enforces this too, as a CHECK constraint — this is the
    layer that produces a readable refusal instead of an integrity error.
    """
    person_id = principal.person_id
    if person_id is None:
        return

    if action == "VERIFY":
        submitted_by = getattr(obj, "submitted_by_person_id", None)
        assigned_to = getattr(obj, "assigned_to_person_id", None)
        if submitted_by and submitted_by == person_id:
            raise Unprocessable(
                "the person who submitted this cannot verify it",
                {"rule": "SEPARATION_OF_DUTIES", "conflict": "submitter"},
            )
        if assigned_to and assigned_to == person_id:
            raise Unprocessable(
                "the person assigned to this cannot verify it",
                {"rule": "SEPARATION_OF_DUTIES", "conflict": "assignee"},
            )


async def check_closure_authority(
    session: AsyncSession,
    principal: Principal,
    *,
    resource_type: str,
    category: str,
    issuing_authority_id: str | None = None,
) -> None:
    """Closure authority is graded by category, not by job title.

    A regulator-issued finding carries an issuing authority, and operator
    authority never implies the authority to close it.
    """
    rows = (
        (
            await session.execute(
                text(
                    """
                SELECT c.code, rcp.issuing_authority_id
                FROM resource_closure_policy rcp
                JOIN capability c ON c.id = rcp.required_capability_id
                WHERE rcp.resource_type = :rt
                  AND rcp.category = :cat
                  AND rcp.valid_from <= :now
                  AND (rcp.valid_until IS NULL OR rcp.valid_until > :now)
                """
                ),
                {"rt": resource_type, "cat": category, "now": utcnow()},
            )
        )
        .mappings()
        .all()
    )

    if not rows:
        return  # no policy row means no extra gate beyond the action capability

    for row in rows:
        if row["issuing_authority_id"] not in (None, issuing_authority_id):
            continue
        if principal.holds(row["code"]):
            return

    raise Forbidden(
        f"closing a {category} {resource_type} needs authority this principal does not hold",
        {
            "required_capability": [r["code"] for r in rows],
            "category": category,
            "issuing_authority_id": issuing_authority_id,
        },
    )


def severity_category(obj: Any) -> str:
    """Map a record to the closure-policy category it falls under."""
    if getattr(obj, "issuing_authority_id", None):
        return "REGULATOR_ISSUED"
    severity = getattr(obj, "severity", None)
    return str(getattr(severity, "value", severity) or "SIGNIFICANT")
