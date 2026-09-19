class AppError(Exception):
    """Base class for all application-raised exceptions."""
    status_code: int = 500
    default_detail: str = "Internal server error"

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or self.default_detail
        super().__init__(self.detail)


class NotFoundError(AppError):
    status_code = 404
    default_detail = "Resource not found"


class ConflictError(AppError):
    status_code = 409
    default_detail = "Conflict with current state"


class ForbiddenError(AppError):
    status_code = 403
    default_detail = "Not permitted"


class ValidationFailedError(AppError):
    status_code = 422
    default_detail = "Validation failed"