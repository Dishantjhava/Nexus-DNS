"""DNS-record service — CRUD + paginated listing + values_json serialization."""

import json
import math
from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DBSession

from app.exceptions import AppException
from app.models.dns_record import DnsRecord
from app.schemas.dns_record import (
    DnsRecordCreate,
    DnsRecordUpdate,
    _validate_dns_values,
)


# ── Helpers ──────────────────────────────────────────────

def _serialize_values(values: list) -> str:
    """Convert a list of Pydantic models / strings to a JSON string for storage."""
    return json.dumps(
        [v.model_dump() if hasattr(v, "model_dump") else v for v in values]
    )


# ── Public API ───────────────────────────────────────────

def list_dns_records(
    db: DBSession,
    zone_id: int,
    search: str | None = None,
    type_filter: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """Return a paginated dict matching ``PaginatedResponse`` shape."""
    query = db.query(DnsRecord).filter(DnsRecord.hosted_zone_id == zone_id)

    if search:
        query = query.filter(DnsRecord.name.ilike(f"%{search}%"))
    if type_filter:
        query = query.filter(DnsRecord.type == type_filter.upper())

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))

    records = (
        query
        .order_by(DnsRecord.name, DnsRecord.type)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": records,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


def create_dns_record(
    db: DBSession,
    zone_id: int,
    data: DnsRecordCreate,
) -> DnsRecord:
    """Insert a new DNS record.  Raises 409 on duplicate (zone_id, name, type)."""
    record = DnsRecord(
        hosted_zone_id=zone_id,
        name=data.name,
        type=data.type,
        ttl=data.ttl,
        values_json=_serialize_values(data.values),
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppException(
            409,
            "DUPLICATE_RECORD",
            f"A {data.type} record with name '{data.name}' already exists in this zone",
        )
    db.refresh(record)
    return record


def get_dns_record(
    db: DBSession,
    zone_id: int,
    record_id: int,
) -> DnsRecord | None:
    """Fetch a single record scoped to its zone."""
    return (
        db.query(DnsRecord)
        .filter(DnsRecord.id == record_id, DnsRecord.hosted_zone_id == zone_id)
        .first()
    )


def update_dns_record(
    db: DBSession,
    zone_id: int,
    record_id: int,
    data: DnsRecordUpdate,
) -> DnsRecord | None:
    """Partial-update a DNS record.

    Validation rules:
    - type + values both present → already validated by Pydantic
    - values only (no type)     → service validates against existing record type
    - type only (no values)     → rejected (values must accompany type changes)
    """
    record = (
        db.query(DnsRecord)
        .filter(DnsRecord.id == record_id, DnsRecord.hosted_zone_id == zone_id)
        .first()
    )
    if record is None:
        return None

    provided = data.model_fields_set
    has_type = "type" in provided
    has_values = "values" in provided

    # Changing type without values is not allowed
    if has_type and not has_values:
        raise AppException(
            400,
            "INVALID_UPDATE",
            "When changing record type, values must also be provided",
        )

    # Changing values without type → validate against the existing type
    if has_values and not has_type:
        try:
            _validate_dns_values(record.type, data.values)
        except ValueError as exc:
            raise AppException(422, "VALIDATION_ERROR", str(exc))

    # Apply scalar fields
    if "name" in provided:
        record.name = data.name
    if "ttl" in provided:
        record.ttl = data.ttl
    if has_type:
        record.type = data.type
    if has_values:
        record.values_json = _serialize_values(data.values)

    record.updated_at = datetime.utcnow()

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppException(
            409,
            "DUPLICATE_RECORD",
            f"A {record.type} record with name '{record.name}' already exists in this zone",
        )
    db.refresh(record)
    return record


def delete_dns_record(
    db: DBSession,
    zone_id: int,
    record_id: int,
) -> bool:
    """Delete a record scoped to its zone.  Returns ``False`` if not found."""
    record = (
        db.query(DnsRecord)
        .filter(DnsRecord.id == record_id, DnsRecord.hosted_zone_id == zone_id)
        .first()
    )
    if record is None:
        return False
    db.delete(record)
    db.commit()
    return True
