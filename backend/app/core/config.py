"""Settings. Every secret and connection string, loaded once."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: Literal["local", "demo", "production"] = "local"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://strata:strata@localhost:5432/strata"
    database_echo: bool = False
    # Supavisor must run in session mode: transaction pooling breaks SET LOCAL,
    # which is how tenant context reaches RLS.
    database_pool_size: int = 10

    redis_url: str = "redis://localhost:6379/0"

    session_cookie_name: str = "strata_session"
    session_idle_minutes: int = 60
    session_absolute_hours: int = 12

    storage_endpoint_url: str = "http://localhost:9000"
    storage_bucket_originals: str = "strata-originals"
    storage_bucket_derived: str = "strata-derived"
    storage_access_key: str = "strata"
    storage_secret_key: str = "strata-secret"  # noqa: S105 - local MinIO default, overridden by env
    storage_presign_ttl_seconds: int = 900

    openfga_api_url: str = "http://localhost:8080"
    openfga_store_id: str = ""
    openfga_model_id: str = ""

    # DEMO ESCAPE HATCH. When true, step 5 of the authorization chain (the
    # OpenFGA graph check) is skipped and the policy layer alone decides.
    # Every other step still runs: session, tenant scope, action legality,
    # state precondition, separation of duties, audit. Never true in
    # production — app startup refuses the combination.
    authz_skip_graph_check: bool = False

    ai_gateway_enabled: bool = False
    google_api_key: str = ""
    groq_api_key: str = ""

    api_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.environment == "production" and settings.authz_skip_graph_check:
        raise RuntimeError(
            "authz_skip_graph_check cannot be enabled in production: the "
            "authorization graph is not optional outside a demo."
        )
    return settings
