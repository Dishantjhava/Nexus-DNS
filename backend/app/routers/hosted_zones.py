"""Hosted-zones router — CRUD with pagination and search."""

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.dependencies import get_current_user
from app.exceptions import AppException
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.hosted_zone import (
    HostedZoneCreate,
    HostedZoneResponse,
    HostedZoneUpdate,
)
from app.services import hosted_zone_service

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])


@router.get("")
def list_zones(
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """List hosted zones with optional name search and pagination."""
    result = hosted_zone_service.list_hosted_zones(db, search, page, page_size)
    return PaginatedResponse[HostedZoneResponse](
        items=[HostedZoneResponse.model_validate(z) for z in result["items"]],
        page=result["page"],
        page_size=result["page_size"],
        total=result["total"],
        total_pages=result["total_pages"],
    )


@router.post("", status_code=201)
def create_zone(
    body: HostedZoneCreate,
    _user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Create a new hosted zone."""
    zone = hosted_zone_service.create_hosted_zone(db, body)
    return HostedZoneResponse.model_validate(zone)


@router.get("/{zone_id}")
def get_zone(
    zone_id: int,
    _user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Get a single hosted zone by ID."""
    zone = hosted_zone_service.get_hosted_zone(db, zone_id)
    if zone is None:
        raise AppException(404, "HOSTED_ZONE_NOT_FOUND", "Hosted zone not found")
    return HostedZoneResponse.model_validate(zone)


@router.patch("/{zone_id}")
@router.put("/{zone_id}")
def update_zone(
    zone_id: int,
    body: HostedZoneUpdate,
    _user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Partial-update a hosted zone."""
    zone = hosted_zone_service.update_hosted_zone(db, zone_id, body)
    if zone is None:
        raise AppException(404, "HOSTED_ZONE_NOT_FOUND", "Hosted zone not found")
    return HostedZoneResponse.model_validate(zone)


@router.delete("/{zone_id}")
def delete_zone(
    zone_id: int,
    _user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Delete a hosted zone and cascade-delete all its DNS records."""
    deleted = hosted_zone_service.delete_hosted_zone(db, zone_id)
    if not deleted:
        raise AppException(404, "HOSTED_ZONE_NOT_FOUND", "Hosted zone not found")
    return Response(status_code=204)
