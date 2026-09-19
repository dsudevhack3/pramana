from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.core.exceptions.base_exceptions import AppError


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        from src.config.logging_config import get_logger

        get_logger("error_handler").exception("unhandled_exception", path=request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})