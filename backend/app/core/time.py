"""Time. Everything is UTC-aware; naive datetimes never enter the system."""

from datetime import UTC, datetime


def utcnow() -> datetime:
    return datetime.now(UTC)


def isoformat(value: datetime | None) -> str | None:
    """RFC 3339 with a trailing Z, which is what the contract puts on the wire."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")
