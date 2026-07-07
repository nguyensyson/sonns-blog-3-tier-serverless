from typing import Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from utils.logger import get_logger

logger = get_logger(__name__)


class AppError(Exception):
    """Base class for every intentionally-raised business error. Routers never
    build error JSON themselves - they raise one of these (or a subclass) and
    register_exception_handlers() below turns it into the standard envelope."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, details: Optional[list] = None):
        self.message = message
        self.details = details
        super().__init__(message)


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "UNAUTHORIZED"

    def __init__(self, message: str = "Yêu cầu đăng nhập hoặc token không hợp lệ."):
        super().__init__(message)


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "FORBIDDEN"

    def __init__(self, message: str = "Bạn không có quyền thực hiện thao tác này."):
        super().__init__(message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "NOT_FOUND"

    def __init__(self, message: str = "Không tìm thấy tài nguyên."):
        super().__init__(message)


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "CONFLICT"

    def __init__(self, message: str = "Dữ liệu đã tồn tại."):
        super().__init__(message)


class ValidationAppError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "VALIDATION_ERROR"

    def __init__(self, message: str = "Dữ liệu không hợp lệ.", details: Optional[list] = None):
        super().__init__(message, details)


def _error_body(code: str, message: str, details: Optional[list] = None) -> dict:
    error: dict = {"code": code, "message": message}
    if details:
        error["details"] = details
    return {"success": False, "error": error}


def register_exception_handlers(app: FastAPI) -> None:
    """Attaches the standard error envelope to a FastAPI app instance. Call
    once from each module's main.py right after creating the app."""

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(exc.code, exc.message, exc.details),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        details = [
            {"field": ".".join(str(part) for part in err["loc"] if part != "body"), "message": err["msg"]}
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=_error_body("VALIDATION_ERROR", "Dữ liệu không hợp lệ.", details),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception):
        logger.exception("Unhandled error while processing %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_body("INTERNAL_ERROR", "Đã xảy ra lỗi hệ thống."),
        )
