"""Shared response schemas: pagination wrapper and error envelope."""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard list response with pagination metadata."""
    items: list[T]
    page: int
    page_size: int
    total: int
    total_pages: int


class ErrorDetail(BaseModel):
    """Inner error object."""
    code: str
    message: str


class ErrorResponse(BaseModel):
    """Standard error envelope."""
    error: ErrorDetail
