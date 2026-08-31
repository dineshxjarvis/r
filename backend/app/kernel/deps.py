"""Request dependencies: session, principal, request id.

The tenant the transaction runs under comes from the resolved principal, not
from anything the client sent. A `tenant_id` in a body or query string is an
input to be authorized, never a grant.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.authz.principal import Principal, resolve_session
from app.core.config import get_settings
from app.core.db import get_sessionmaker, set_request_context
from app.core.errors import Unauthenticated
from app.core.ids import new_id


def request_id(request: Request) -> str:
    existing = getattr(request.state, "request_id", None)
    if existing:
        return str(existing)
    generated = new_id("domain_audit_event").replace("aud_", "req_")
    request.state.request_id = generated
    return generated


async def db_session() -> AsyncIterator[AsyncSession]:
    """An unbound session, used only to resolve the principal.

    Tenant context cannot be set before we know who is calling, so principal
    resolution runs first and the context is applied to the same transaction
    immediately afterwards.
    """
    maker = get_sessionmaker()
    async with maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def current_principal(
    request: Request, session: AsyncSession = Depends(db_session)
) -> Principal:
    settings = get_settings()
    cookie = request.cookies.get(settings.session_cookie_name)
    if not cookie:
        raise Unauthenticated("no session cookie")

    principal = await resolve_session(session, cookie)

    await set_request_context(
        session,
        tenant_id=principal.tenant_id,
        principal_id=principal.principal_id,
        person_id=principal.person_id,
        # Derived from the principal's jurisdiction, never from the request.
        portfolio=principal.is_platform,
    )
    return principal


@dataclass(slots=True)
class RequestContext:
    """What every handler needs and nothing it does not."""

    session: AsyncSession
    principal: Principal
    request_id: str
    idempotency_key: str | None
    if_match: str | None


async def context(
    request: Request,
    session: AsyncSession = Depends(db_session),
    principal: Principal = Depends(current_principal),
    rid: str = Depends(request_id),
) -> RequestContext:
    return RequestContext(
        session=session,
        principal=principal,
        request_id=rid,
        idempotency_key=request.headers.get("Idempotency-Key"),
        if_match=request.headers.get("If-Match"),
    )
