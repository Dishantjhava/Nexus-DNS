"""Custom application exceptions with structured error codes."""


class AppException(Exception):
    """Structured API error that maps to the standard error response envelope.

    Usage:
        raise AppException(404, "HOSTED_ZONE_NOT_FOUND", "Hosted zone not found")

    The exception handler in main.py converts this to:
        {"error": {"code": "HOSTED_ZONE_NOT_FOUND", "message": "Hosted zone not found"}}
    """

    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)
