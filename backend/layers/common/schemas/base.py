from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = "OK"


class ErrorDetail(BaseModel):
    field: str
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorBody


class PaginationParams(BaseModel):
    limit: int = 20
    cursor: Optional[str] = None


class PaginatedData(BaseModel, Generic[T]):
    items: List[T]
    nextCursor: Optional[str] = None
