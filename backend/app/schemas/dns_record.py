"""DNS Record schemas with full per-type value validation.

The shared ``_validate_dns_values`` helper is called by both
``DnsRecordCreate`` (always) and ``DnsRecordUpdate`` (only when
both ``type`` and ``values`` are present in the update payload).
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.utils.validators import is_valid_hostname, is_valid_ipv4, is_valid_ipv6

# ── Record type literal ──────────────────────────────────
DnsRecordType = Literal[
    "A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"
]


# ── Structured-value sub-schemas ─────────────────────────

class MxValue(BaseModel):
    """MX record value: priority + mail exchange hostname."""
    priority: int = Field(ge=0, le=65535)
    exchange: str = Field(min_length=1, max_length=253)


class SrvValue(BaseModel):
    """SRV record value: priority, weight, port, target."""
    priority: int = Field(ge=0, le=65535)
    weight: int = Field(ge=0, le=65535)
    port: int = Field(ge=0, le=65535)
    target: str = Field(min_length=1, max_length=253)


class CaaValue(BaseModel):
    """CAA record value: flag, tag, value."""
    flag: int = Field(ge=0, le=255)
    tag: Literal["issue", "issuewild", "iodef"]
    value: str = Field(min_length=1)


# ── Shared validation logic ─────────────────────────────

def _validate_dns_values(record_type: str, values: list) -> None:
    """Enforce exact value shapes per DNS record type.

    Raises ``ValueError`` with a descriptive message on any mismatch.
    """
    if not values:
        raise ValueError("values must not be empty")

    match record_type:
        # ── Simple string types (IP addresses) ───────────
        case "A":
            for v in values:
                if not isinstance(v, str):
                    raise ValueError(f"A record values must be strings, got {type(v).__name__}")
                if not is_valid_ipv4(v):
                    raise ValueError(f"Invalid IPv4 address: {v}")

        case "AAAA":
            for v in values:
                if not isinstance(v, str):
                    raise ValueError(f"AAAA record values must be strings, got {type(v).__name__}")
                if not is_valid_ipv6(v):
                    raise ValueError(f"Invalid IPv6 address: {v}")

        # ── Single-value hostname types ──────────────────
        case "CNAME" | "PTR":
            if len(values) != 1:
                raise ValueError(
                    f"{record_type} records must have exactly one value, got {len(values)}"
                )
            v = values[0]
            if not isinstance(v, str) or not is_valid_hostname(v):
                raise ValueError(f"Invalid hostname for {record_type}: {v}")

        # ── Multi-value hostname type ────────────────────
        case "NS":
            for v in values:
                if not isinstance(v, str):
                    raise ValueError(f"NS record values must be strings, got {type(v).__name__}")
                if not is_valid_hostname(v):
                    raise ValueError(f"Invalid hostname in NS record: {v}")

        # ── Free-text type ───────────────────────────────
        case "TXT":
            for v in values:
                if not isinstance(v, str):
                    raise ValueError(f"TXT record values must be strings, got {type(v).__name__}")

        # ── Structured object types ──────────────────────
        case "MX":
            for v in values:
                if not isinstance(v, MxValue):
                    raise ValueError(
                        "MX record values must be {priority, exchange} objects"
                    )
                if not is_valid_hostname(v.exchange):
                    raise ValueError(f"Invalid hostname in MX exchange: {v.exchange}")

        case "SRV":
            for v in values:
                if not isinstance(v, SrvValue):
                    raise ValueError(
                        "SRV record values must be {priority, weight, port, target} objects"
                    )
                if not is_valid_hostname(v.target):
                    raise ValueError(f"Invalid hostname in SRV target: {v.target}")

        case "CAA":
            for v in values:
                if not isinstance(v, CaaValue):
                    raise ValueError(
                        "CAA record values must be {flag, tag, value} objects"
                    )


# ── CRUD schemas ─────────────────────────────────────────

class DnsRecordCreate(BaseModel):
    """POST /api/hosted-zones/{id}/records body."""
    name: str = Field(min_length=1, max_length=253)
    type: DnsRecordType
    ttl: int = Field(default=300, ge=1, le=2147483647)
    values: list[str | MxValue | SrvValue | CaaValue] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_values_for_type(self) -> "DnsRecordCreate":
        """Enforce per-type value shapes on every create."""
        _validate_dns_values(self.type, self.values)
        return self


class DnsRecordUpdate(BaseModel):
    """PATCH /api/hosted-zones/{id}/records/{record_id} body.

    All fields are optional.  The per-type validator only fires when
    *both* ``type`` and ``values`` are present, so updating just ``ttl``
    skips value-shape validation entirely.
    """
    name: str | None = Field(default=None, min_length=1, max_length=253)
    type: DnsRecordType | None = None
    ttl: int | None = Field(default=None, ge=1, le=2147483647)
    values: list[str | MxValue | SrvValue | CaaValue] | None = None

    @model_validator(mode="after")
    def validate_values_for_type(self) -> "DnsRecordUpdate":
        """Re-run per-type validation when both type and values are present."""
        if self.type is not None and self.values is not None:
            _validate_dns_values(self.type, self.values)
        return self


class DnsRecordResponse(BaseModel):
    """Response body for a single DNS record."""
    id: int
    hosted_zone_id: int
    name: str
    type: str
    ttl: int
    values: list[str | MxValue | SrvValue | CaaValue]  # deserialized from values_json
    is_system: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
