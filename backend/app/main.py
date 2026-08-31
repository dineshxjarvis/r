"""App factory: settings, logging, error handling, router mount, lifespan.

Route order is load-bearing. The generic `/{collection}` forms are mounted
last, so a specific path like `/auth/sessions` or `/evidence/sync` is never
swallowed by being read as a collection name.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.db import dispose_engine
from app.core.errors import StrataError
from app.core.ids import new_id
from app.core.logging import configure_logging, get_logger
from app.kernel.envelope import failure

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.debug)

    # Importing the domain package is what registers every collection.
    # Imported as a submodule name rather than `import app.domains`, which
    # would rebind the module-level `app` to the package.
    from app import domains as _domains  # noqa: F401
    from app.kernel.registry import registry

    log.info(
        "startup",
        environment=settings.environment,
        collections=len(registry.collections()),
        graph_check=not settings.authz_skip_graph_check,
    )
    if settings.authz_skip_graph_check:
        log.warning(
            "authorization_graph_disabled",
            detail=(
                "OpenFGA check is skipped; policy layer alone is deciding. "
                "Production refuses this combination."
            ),
        )

    yield

    from app.authz.fga import close_fga

    await close_fga()
    await dispose_engine()
    log.info("shutdown")


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.debug)

    application = FastAPI(
        title="Strata API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        openapi_url="/openapi.json",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,  # the session cookie has to ride along
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["ETag", "Location", "Idempotency-Replayed"],
    )

    _register_error_handlers(application)
    _mount_routers(application, settings.api_prefix)

    @application.get("/health")
    async def health() -> dict[str, Any]:
        return {"status": "ok"}

    return application


def _register_error_handlers(application: FastAPI) -> None:
    @application.exception_handler(StrataError)
    async def strata_error(request: Request, exc: StrataError) -> JSONResponse:
        rid = getattr(request.state, "request_id", None) or new_id("domain_audit_event").replace(
            "aud_", "req_"
        )
        if exc.status_code >= 500:
            log.error("request_failed", code=exc.code, message=exc.message, request_id=rid)
        return JSONResponse(
            status_code=exc.status_code,
            content=failure(exc.code, exc.message, request_id=rid, details=exc.details),
        )

    @application.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        """FastAPI's own body validation, reshaped into the contract's error
        envelope so a client parses one error format, not two."""
        rid = getattr(request.state, "request_id", None) or "req_unknown"
        errors = [
            {
                "field": ".".join(str(p) for p in err.get("loc", ()) if p != "body"),
                "code": str(err.get("type", "INVALID")).upper(),
                "message": err.get("msg", "invalid"),
            }
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=400,
            content=failure(
                "VALIDATION_ERROR",
                "the request body is not valid",
                request_id=rid,
                details={"errors": errors},
            ),
        )

    @application.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception) -> JSONResponse:
        rid = getattr(request.state, "request_id", None) or "req_unknown"
        log.exception("unhandled_error", request_id=rid, path=request.url.path)
        return JSONResponse(
            status_code=500,
            content=failure("INTERNAL_ERROR", "an unexpected error occurred", request_id=rid),
        )


def _mount_routers(application: FastAPI, prefix: str) -> None:
    from app.domains.dashboard.routes import router as dashboard_router
    from app.domains.documents.uploads import router as uploads_router
    from app.domains.evidence.sync import router as sync_router
    from app.domains.identity.auth import router as auth_router
    from app.kernel.introspect import router as introspect_router
    from app.kernel.operations import router as operations_router
    from app.kernel.routes import router as kernel_router

    # Specific paths first.
    application.include_router(auth_router, prefix=prefix, tags=["identity"])
    application.include_router(introspect_router, prefix=prefix, tags=["introspection"])
    application.include_router(operations_router, prefix=prefix, tags=["operations"])
    application.include_router(dashboard_router, prefix=prefix, tags=["dashboard"])
    application.include_router(uploads_router, prefix=prefix, tags=["documents"])
    application.include_router(sync_router, prefix=prefix, tags=["evidence"])

    # The generic collection forms last, so they cannot shadow the above.
    application.include_router(kernel_router, prefix=prefix, tags=["resources"])


app = create_app()
