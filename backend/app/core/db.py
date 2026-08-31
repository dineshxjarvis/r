"""Database engine, session, and the tenant context that reaches RLS.

Every request transaction opens with `SET LOCAL app.tenant_id` taken from the
**resolved principal**. A tenant_id in a request body or query string is an
input to be authorized, never a grant.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy import Text, cast, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator, UserDefinedType

from app.core.config import get_settings


class Base(DeclarativeBase):
    """Declarative base. Models mirror the migration; the migration is authority."""

    type_annotation_map: dict[Any, Any] = {}


class _NamedPgType(UserDefinedType[str]):
    """A bare reference to a type that already exists in the database."""

    cache_ok = True

    def __init__(self, type_name: str) -> None:
        self.type_name = type_name

    def get_col_spec(self, **_: Any) -> str:
        return self.type_name


class PgEnum(TypeDecorator[str]):
    """A PostgreSQL enum column that behaves as a plain string in Python.

    Two problems this solves at once:

    A native enum column compared against a string parameter fails outright —
    `operator does not exist: mine_type = character varying`. PostgreSQL will
    not guess the cast, so the bind is cast explicitly here.

    And the vocabulary stays where it belongs. The migration owns the enum
    members; restating them in Python would be a second definition free to
    drift, and the API treats these as open vocabularies anyway — a client is
    required to tolerate a value it has not seen, so the server should too.
    Values travel in and out as ordinary strings.
    """

    impl = Text
    cache_ok = True

    def __init__(self, type_name: str) -> None:
        self.type_name = type_name
        super().__init__()

    def bind_expression(self, bindparam: Any) -> Any:
        return cast(bindparam, _NamedPgType(self.type_name))


def pg_enum(type_name: str) -> PgEnum:
    """Reference a PostgreSQL enum type the migration already created."""
    return PgEnum(type_name)


_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.database_echo,
            pool_size=settings.database_pool_size,
            max_overflow=5,
            pool_pre_ping=True,
        )
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(get_engine(), expire_on_commit=False, autoflush=False)
    return _sessionmaker


async def dispose_engine() -> None:
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None


async def set_request_context(
    session: AsyncSession,
    *,
    tenant_id: str | None,
    principal_id: str | None = None,
    person_id: str | None = None,
    request_source: str = "api",
    portfolio: bool = False,
) -> None:
    """Bind the transaction to one tenant and actor.

    `SET LOCAL` scopes these to the current transaction, so a pooled
    connection never leaks context to the next request. An unset
    `app.tenant_id` makes every RLS policy fail closed rather than open.

    `portfolio` is set only for a principal whose jurisdiction actually
    grants a cross-tenant portfolio. It relaxes the RLS *read* half; the
    write half stays tenant-bound, and the real clipping is the authorized
    resource set the query layer applies.
    """
    await session.execute(
        text("SELECT set_config('app.tenant_id', :v, true)"),
        {"v": tenant_id or ""},
    )
    await session.execute(
        text("SELECT set_config('app.principal_id', :v, true)"),
        {"v": principal_id or ""},
    )
    await session.execute(
        text("SELECT set_config('app.actor_person_id', :v, true)"),
        {"v": person_id or ""},
    )
    await session.execute(
        text("SELECT set_config('app.request_source', :v, true)"),
        {"v": request_source},
    )
    await session.execute(
        text("SELECT set_config('app.portfolio', :v, true)"),
        {"v": "on" if portfolio else "off"},
    )


@asynccontextmanager
async def session_scope(
    *,
    tenant_id: str | None = None,
    principal_id: str | None = None,
    person_id: str | None = None,
    request_source: str = "api",
    portfolio: bool = False,
) -> AsyncIterator[AsyncSession]:
    """One transaction, context-bound, committed or rolled back as a unit.

    This is the transaction boundary the contract requires: domain change,
    audit event and outbox row commit together or not at all.
    """
    maker = get_sessionmaker()
    async with maker() as session:
        try:
            await set_request_context(
                session,
                tenant_id=tenant_id,
                principal_id=principal_id,
                person_id=person_id,
                request_source=request_source,
                portfolio=portfolio,
            )
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
