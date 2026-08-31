"""Authentication. The one place a session is created or destroyed.

The browser cookie carries a high-entropy opaque ID and nothing else — no
role, no tenant, no permission. Server-side state holds the principal,
expiry, assurance and a revocation version, and authority is re-derived on
every request rather than cached for the session's lifetime.
"""

from __future__ import annotations

import secrets
from datetime import timedelta
from typing import Any, Literal

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.event import stream_key_for  # noqa: F401  (documents the stream split)
from app.authz.principal import Principal, hash_session_id
from app.core.config import get_settings
from app.core.errors import Unauthenticated, ValidationError
from app.core.ids import new_id
from app.core.time import isoformat, utcnow
from app.kernel.deps import RequestContext, context, db_session, request_id
from app.kernel.envelope import success

router = APIRouter()
hasher = PasswordHasher()


class SessionCreate(BaseModel):
    """All authentication methods ride one route, discriminated by `method`.

    A new method is a new discriminator value, not a new endpoint.
    """

    method: Literal["PASSWORD", "OIDC", "PASSKEY"] = "PASSWORD"
    email: str | None = None
    password: str | None = None
    # OIDC / passkey fields land here when those methods are wired.
    assertion: dict[str, Any] | None = None


async def _security_event(
    session: AsyncSession,
    *,
    event_type: str,
    principal_id: str | None,
    request: Request,
    detail: dict[str, Any] | None = None,
) -> None:
    """Login success, failure, logout and revocation are all logged.

    Failures matter more than successes here — a burst of them is the signal
    an oversight review is looking for.
    """
    import json

    await session.execute(
        text(
            """
            INSERT INTO security_event (
              id, principal_id, event_type, detail, ip_address, user_agent
            )
            VALUES (:id, :pid, :et, CAST(:detail AS jsonb), :ip, :ua)
            """
        ),
        {
            "id": new_id("security_event"),
            "pid": principal_id,
            "et": event_type,
            "detail": json.dumps(detail or {}),
            "ip": request.client.host if request.client else None,
            "ua": request.headers.get("user-agent"),
        },
    )


@router.post("/auth/sessions", status_code=201)
async def create_session(
    body: SessionCreate,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(db_session),
    rid: str = Depends(request_id),
) -> dict[str, Any]:
    if body.method != "PASSWORD":
        raise ValidationError(
            f"{body.method} authentication is not wired in this build",
            {"field": "method", "supported": ["PASSWORD"]},
        )
    if not body.email or not body.password:
        raise ValidationError(
            "email and password are required for PASSWORD authentication",
            {"errors": [{"field": "email", "code": "REQUIRED", "message": "is required"}]},
        )

    row = (
        (
            await session.execute(
                text(
                    """
                SELECT p.id AS principal_id, p.status, p.credential_version,
                       pa.password_hash, per.id AS person_id, per.display_name
                FROM person per
                JOIN principal p ON p.person_id = per.id
                LEFT JOIN password_authenticator pa
                       ON pa.principal_id = p.id AND pa.revoked_at IS NULL
                WHERE lower(per.primary_email) = lower(:email)
                """
                ),
                {"email": body.email},
            )
        )
        .mappings()
        .first()
    )

    # One failure message for a missing account and a wrong password alike:
    # distinguishing them tells an attacker which emails are registered.
    if row is None or not row["password_hash"]:
        await _security_event(
            session,
            event_type="login.failure",
            principal_id=None,
            request=request,
            detail={"reason": "unknown_principal"},
        )
        raise Unauthenticated("email or password is incorrect")

    try:
        hasher.verify(row["password_hash"], body.password)
    except VerifyMismatchError as exc:
        await _security_event(
            session,
            event_type="login.failure",
            principal_id=row["principal_id"],
            request=request,
            detail={"reason": "bad_password"},
        )
        raise Unauthenticated("email or password is incorrect") from exc

    if row["status"] != "ACTIVE":
        await _security_event(
            session,
            event_type="login.failure",
            principal_id=row["principal_id"],
            request=request,
            detail={"reason": "principal_not_active"},
        )
        raise Unauthenticated("this account is not active")

    settings = get_settings()
    now = utcnow()
    raw_cookie = secrets.token_urlsafe(48)
    csrf = secrets.token_urlsafe(32)

    # Resolved through a SECURITY DEFINER function: RLS on `organization`
    # is keyed on the very tenant this lookup is trying to discover, so a
    # direct read here returns nothing and the session is born tenant-less.
    tenant_id = (
        await session.execute(
            text("SELECT resolve_login_tenant(:person_id)"),
            {"person_id": row["person_id"]},
        )
    ).scalar_one_or_none()

    await session.execute(
        text(
            """
            INSERT INTO session (
              id_hash, principal_id, credential_version, assurance_level,
              authenticated_at, issued_at, last_seen_at,
              idle_expires_at, absolute_expires_at,
              selected_tenant_id, csrf_secret_hash, user_agent
            ) VALUES (
              :id_hash, :pid, :cv, 'PASSWORD',
              :now, :now, :now, :idle, :absolute,
              :tenant, :csrf, :ua
            )
            """
        ),
        {
            "id_hash": hash_session_id(raw_cookie),
            "pid": row["principal_id"],
            "cv": row["credential_version"],
            "now": now,
            "idle": now + timedelta(minutes=settings.session_idle_minutes),
            "absolute": now + timedelta(hours=settings.session_absolute_hours),
            "tenant": tenant_id,
            "csrf": hash_session_id(csrf),
            "ua": request.headers.get("user-agent"),
        },
    )
    await session.execute(
        text("UPDATE principal SET last_authenticated_at = :now WHERE id = :pid"),
        {"now": now, "pid": row["principal_id"]},
    )
    await _security_event(
        session,
        event_type="login.success",
        principal_id=row["principal_id"],
        request=request,
    )

    response.set_cookie(
        settings.session_cookie_name,
        raw_cookie,
        httponly=True,
        secure=settings.environment != "local",
        samesite="strict",
        max_age=settings.session_absolute_hours * 3600,
        path="/",
    )

    return success(
        {
            "principal_id": row["principal_id"],
            "person": {
                "type": "person",
                "id": row["person_id"],
                "display": row["display_name"],
            },
            "assurance": "PASSWORD",
            "tenant_id": tenant_id,
            "csrf_token": csrf,
            "expires_at": isoformat(now + timedelta(hours=settings.session_absolute_hours)),
        },
        request_id=rid,
        message="signed in",
    )


@router.get("/auth/sessions")
async def list_sessions(ctx: RequestContext = Depends(context)) -> dict[str, Any]:
    rows = (
        (
            await ctx.session.execute(
                text(
                    """
                SELECT id_hash, assurance_level, authenticated_at, last_seen_at,
                       idle_expires_at, absolute_expires_at, user_agent, revoked_at
                FROM session
                WHERE principal_id = :pid
                ORDER BY issued_at DESC
                LIMIT 50
                """
                ),
                {"pid": ctx.principal.principal_id},
            )
        )
        .mappings()
        .all()
    )

    return success(
        [
            {
                # The hash, never the cookie value — this list must not be a
                # way to obtain a usable session token.
                "id": r["id_hash"][:16],
                "object": "session",
                "current": r["id_hash"] == ctx.principal.session_id_hash,
                "assurance": r["assurance_level"],
                "authenticated_at": isoformat(r["authenticated_at"]),
                "last_seen_at": isoformat(r["last_seen_at"]),
                "expires_at": isoformat(r["absolute_expires_at"]),
                "user_agent": r["user_agent"],
                "revoked": r["revoked_at"] is not None,
            }
            for r in rows
        ],
        request_id=ctx.request_id,
    )


class SessionAction(BaseModel):
    action: Literal["REVOKE"]
    reason: str | None = None


@router.post("/auth/sessions/{session_ref}/actions")
async def session_action(
    session_ref: str,
    body: SessionAction,
    request: Request,
    response: Response,
    ctx: RequestContext = Depends(context),
) -> dict[str, Any]:
    """Revoke a session. `current` revokes this one — logging out clears
    server state, because deleting the cookie alone leaves the session valid
    for anyone who copied it."""
    settings = get_settings()
    target_hash = ctx.principal.session_id_hash if session_ref == "current" else None

    if target_hash is None:
        target_hash = (
            await ctx.session.execute(
                text(
                    """
                    SELECT id_hash FROM session
                    WHERE principal_id = :pid AND id_hash LIKE :prefix
                    """
                ),
                {"pid": ctx.principal.principal_id, "prefix": f"{session_ref}%"},
            )
        ).scalar_one_or_none()

    if target_hash is None:
        raise ValidationError("no such session", {"session": session_ref})

    await ctx.session.execute(
        text(
            """
            UPDATE session
            SET revoked_at = :now, revocation_reason = :reason
            WHERE id_hash = :h AND principal_id = :pid
            """
        ),
        {
            "now": utcnow(),
            "reason": body.reason or "revoked by holder",
            "h": target_hash,
            "pid": ctx.principal.principal_id,
        },
    )
    await _security_event(
        ctx.session,
        event_type="session.revoked",
        principal_id=ctx.principal.principal_id,
        request=request,
    )

    if session_ref == "current":
        response.delete_cookie(settings.session_cookie_name, path="/")

    return success(
        {"revoked": True, "session": session_ref},
        request_id=ctx.request_id,
        message="session revoked",
    )


@router.get("/users/me")
async def current_user(ctx: RequestContext = Depends(context)) -> dict[str, Any]:
    """Everything a client needs to draw the shell: who, where, and what for.

    `capabilities` here is the flat set. Whether a *particular record* allows
    a particular action is `available_actions` on that record, which also
    weighs its state.
    """
    principal: Principal = ctx.principal

    mines: list[dict[str, Any]] = []
    if principal.authorized_mine_ids is None:
        rows = (
            (
                await ctx.session.execute(
                    text("SELECT id, name, code FROM mine WHERE status = 'ACTIVE' LIMIT 200")
                )
            )
            .mappings()
            .all()
        )
        mines = [{"type": "mine", "id": r["id"], "display": r["name"]} for r in rows]
    elif principal.authorized_mine_ids:
        rows = (
            (
                await ctx.session.execute(
                    text("SELECT id, name, code FROM mine WHERE id = ANY(:ids)"),
                    {"ids": principal.authorized_mine_ids},
                )
            )
            .mappings()
            .all()
        )
        mines = [{"type": "mine", "id": r["id"], "display": r["name"]} for r in rows]

    return success(
        {
            **principal.to_wire(),
            "capabilities": sorted(principal.capabilities),
            "authorized_mines": mines,
            "scope": {
                # A portfolio principal is not "unfiltered" — their scope is a
                # computed authorized resource set that happens to cross
                # tenants, and it is still a finite list they can be shown.
                "portfolio": principal.is_platform,
                "mine_count": len(mines),
            },
        },
        request_id=ctx.request_id,
    )


class MeUpdate(BaseModel):
    """Selected context is navigation only. Changing it changes what the UI
    defaults to, never what the principal may do."""

    selected_tenant_id: str | None = None
    selected_resource_type: str | None = None
    selected_resource_id: str | None = None


@router.patch("/users/me")
async def update_current_user(
    body: MeUpdate, ctx: RequestContext = Depends(context)
) -> dict[str, Any]:
    await ctx.session.execute(
        text(
            """
            UPDATE session
            SET selected_tenant_id = COALESCE(:t, selected_tenant_id),
                selected_resource_type = COALESCE(:rt, selected_resource_type),
                selected_resource_id = COALESCE(:ri, selected_resource_id)
            WHERE id_hash = :h
            """
        ),
        {
            "t": body.selected_tenant_id,
            "rt": body.selected_resource_type,
            "ri": body.selected_resource_id,
            "h": ctx.principal.session_id_hash,
        },
    )
    return success(
        {"updated": True, "note": "selected context affects navigation only"},
        request_id=ctx.request_id,
    )
