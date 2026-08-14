"""Hosted Zone schemas: create, update, and response."""

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class HostedZoneCreate(BaseModel):
    """POST /api/hosted-zones body."""
    name: str = Field(min_length=1, max_length=253)
    description: str | None = None
    zone_type: Literal["PUBLIC", "PRIVATE"] = "PUBLIC"

    @field_validator("name")
    @classmethod
    def validate_domain_name(cls, v: str) -> str:
        v_clean = v.strip()
        if not v_clean:
            raise ValueError("Domain name is required.")
        if v_clean.startswith("."):
            raise ValueError("Domain name cannot start with a dot.")
        if len(v_clean) > 253:
            raise ValueError("Domain name cannot exceed 253 characters.")
        if ".." in v_clean:
            raise ValueError("Domain name cannot contain consecutive dots.")

        norm = v_clean[:-1] if v_clean.endswith(".") else v_clean
        labels = norm.split(".")
        if len(labels) < 2:
            raise ValueError("Invalid domain name format. Must include a top-level domain (e.g. example.com).")

        for label in labels:
            if not label:
                raise ValueError("Domain name labels cannot be empty.")
            if len(label) > 63:
                raise ValueError("Domain name label cannot exceed 63 characters.")
            if label.startswith("-") or label.endswith("-"):
                raise ValueError("Domain name labels cannot start or end with a hyphen.")
            if not re.match(r"^[a-zA-Z0-9-]+$", label):
                raise ValueError(f"Invalid characters in domain name label '{label}'.")

        return v_clean


class HostedZoneUpdate(BaseModel):
    """PATCH /api/hosted-zones/{id} body. Only description can be updated."""
    description: str | None = None


class HostedZoneResponse(BaseModel):
    """Response body for a single hosted zone."""
    id: int
    public_zone_id: str
    name: str
    description: str | None
    zone_type: str
    record_count: int = 0  # populated from model @property
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
