"""DNS-records router — CRUD nested under hosted zones."""

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.dependencies import get_current_user
from app.exceptions import AppException
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.dns_record import (
    DnsRecordCreate,
    DnsRecordResponse,
    DnsRecordUpdate,
)
from app.services import dns_record_service, hosted_zone_service

router = APIRouter(
    prefix="/api/hosted-zones/{zone_id}/records",
    tags=["dns-records"],
)


# ── Helper ───────────────────────────────────────────────

def _require_zone(db: DBSession, zone_id: int) -> None:
    """Raise 404 if the parent zone doesn't exist."""
    if hosted_zone_service.get_hosted_zone(db, zone_id) is None:
        raise AppException(404, "HOSTED_ZONE_NOT_FOUND", "Hosted zone not found")


# ── Endpoints ────────────────────────────────────────────

@router.get("")
def list_records(
    zone_id: int,
    search: str | None = Query(default=None),
    type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """List DNS records for a zone with optional search and type filter."""
    _require_zone(db, zone_id)
    result = dns_record_service.list_dns_records(
        db, zone_id, search, type, page, page_size
    )
    return PaginatedResponse[DnsRecordResponse](
        items=[DnsRecordResponse.model_validate(r) for r in result["items"]],
        page=result["page"],
        page_size=result["page_size"],
        total=result["total"],
        total_pages=result["total_pages"],
    )


@router.post("", status_code=201)
def create_record(
    zone_id: int,
    body: DnsRecordCreate,
    _user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Create a new DNS record in the specified zone."""
    _require_zone(db, zone_id)
    record = dns_record_service.create_dns_record(db, zone_id, body)
    return DnsRecordResponse.model_validate(record)


@router.get("/{record_id}")
def get_record(
    zone_id: int,
    record_id: int,
    _user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Get a single DNS record by ID."""
    _require_zone(db, zone_id)
    record = dns_record_service.get_dns_record(db, zone_id, record_id)
    if record is None:
        raise AppException(404, "DNS_RECORD_NOT_FOUND", "DNS record not found")
    return DnsRecordResponse.model_validate(record)


@router.patch("/{record_id}")
@router.put("/{record_id}")
def update_record(
    zone_id: int,
    record_id: int,
    body: DnsRecordUpdate,
    _user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Partial-update a DNS record."""
    _require_zone(db, zone_id)
    existing = dns_record_service.get_dns_record(db, zone_id, record_id)
    if existing is None:
        raise AppException(404, "DNS_RECORD_NOT_FOUND", "DNS record not found")
    if existing.is_system:
        raise AppException(403, "SYSTEM_RECORD_PROTECTED", "System-managed records cannot be modified or deleted")

    record = dns_record_service.update_dns_record(db, zone_id, record_id, body)
    return DnsRecordResponse.model_validate(record)


@router.delete("/{record_id}")
def delete_record(
    zone_id: int,
    record_id: int,
    _user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Delete a DNS record."""
    _require_zone(db, zone_id)
    existing = dns_record_service.get_dns_record(db, zone_id, record_id)
    if existing is None:
        raise AppException(404, "DNS_RECORD_NOT_FOUND", "DNS record not found")
    if existing.is_system:
        raise AppException(403, "SYSTEM_RECORD_PROTECTED", "System-managed records cannot be modified or deleted")

    dns_record_service.delete_dns_record(db, zone_id, record_id)
    return Response(status_code=204)
