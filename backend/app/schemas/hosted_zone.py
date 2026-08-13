"""Hosted Zone schemas: create, update, and response."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class HostedZoneCreate(BaseModel):
    """POST /api/hosted-zones body."""
    name: str = Field(min_length=1, max_length=253)
    description: str | None = None
    zone_type: Literal["PUBLIC", "PRIVATE"] = "PUBLIC"


class HostedZoneUpdate(BaseModel):
    """PATCH /api/hosted-zones/{id} body.

    All fields are optional.  The service layer uses ``model_fields_set``
    to distinguish "not provided" from "explicitly set to null" for
    proper PATCH semantics.
    """
    name: str | None = Field(default=None, min_length=1, max_length=253)
    description: str | None = None
    zone_type: Literal["PUBLIC", "PRIVATE"] | None = None


class HostedZoneResponse(BaseModel):
    """Response body for a single hosted zone."""
    id: int
    name: str
    description: str | None
    zone_type: str
    record_count: int = 0  # populated from model @property
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
