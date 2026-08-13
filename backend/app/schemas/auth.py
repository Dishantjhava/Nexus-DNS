"""Auth schemas: login request and user response."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    """POST /api/auth/login body."""
    username: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=1)


class UserResponse(BaseModel):
    """GET /api/auth/me response body."""
    id: int
    username: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
