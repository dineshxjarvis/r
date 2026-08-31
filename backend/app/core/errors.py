"""Error taxonomy. Every machine code the contract defines, and nothing else.

Handlers raise these; one exception handler in main.py turns them into the
error envelope. A handler never builds an error response by hand.
"""

from typing import Any


class StrataError(Exception):
    """Base for every error that maps to a documented status + machine code."""

    status_code: int = 500
    code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ValidationError(StrataError):
    status_code = 400
    code = "VALIDATION_ERROR"


class UnknownAction(StrataError):
    status_code = 400
    code = "UNKNOWN_ACTION"


class UnknownParameter(StrataError):
    status_code = 400
    code = "UNKNOWN_PARAMETER"


class UnknownView(StrataError):
    status_code = 400
    code = "UNKNOWN_VIEW"


class FilterTooDeep(StrataError):
    status_code = 400
    code = "FILTER_TOO_DEEP"


class Unauthenticated(StrataError):
    status_code = 401
    code = "UNAUTHENTICATED"


class Forbidden(StrataError):
    """Visible to you, but this act on it is not allowed.

    Never raised for an object outside the caller's scope — that is NotFound,
    deliberately, so a 403 cannot confirm an object exists.
    """

    status_code = 403
    code = "FORBIDDEN"


class AssuranceRequired(StrataError):
    status_code = 403
    code = "ASSURANCE_REQUIRED"


class NotFound(StrataError):
    status_code = 404
    code = "NOT_FOUND"


class InvalidState(StrataError):
    status_code = 409
    code = "INVALID_STATE"


class VersionConflict(StrataError):
    status_code = 409
    code = "VERSION_CONFLICT"


class Conflict(StrataError):
    status_code = 409
    code = "CONFLICT"


class Unprocessable(StrataError):
    status_code = 422
    code = "UNPROCESSABLE"


class EvidenceInsufficient(StrataError):
    """The closure gate refused. `details` names what is missing or wrong."""

    status_code = 422
    code = "EVIDENCE_INSUFFICIENT"


class UnknownExtensionNamespace(StrataError):
    status_code = 422
    code = "UNKNOWN_EXTENSION_NAMESPACE"


class RateLimited(StrataError):
    status_code = 429
    code = "RATE_LIMITED"


class DependencyUnavailable(StrataError):
    status_code = 503
    code = "DEPENDENCY_UNAVAILABLE"
