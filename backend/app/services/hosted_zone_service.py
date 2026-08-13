import json
import math
from datetime import datetime

from sqlalchemy.orm import Session as DBSession, subqueryload

from app.models.dns_record import DnsRecord
from app.models.hosted_zone import HostedZone
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneUpdate

DEFAULT_NAMESERVERS = [
    "ns-1.awsdns-clone.com",
    "ns-2.awsdns-clone.net",
    "ns-3.awsdns-clone.org",
    "ns-4.awsdns-clone.co.uk",
]


def list_hosted_zones(
    db: DBSession,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """Return a paginated dict matching ``PaginatedResponse`` shape."""
    query = db.query(HostedZone)

    if search:
        query = query.filter(HostedZone.name.ilike(f"%{search}%"))

    total = query.count()
    total_pages = max(1, math.ceil(total / page_size))

    zones = (
        query
        .options(subqueryload(HostedZone.records))  # eager-load for record_count
        .order_by(HostedZone.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": zones,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


def create_hosted_zone(db: DBSession, data: HostedZoneCreate) -> HostedZone:
    """Insert a new hosted zone and auto-create default system NS record set."""
    zone = HostedZone(
        name=data.name,
        description=data.description,
        zone_type=data.zone_type,
    )
    db.add(zone)
    db.flush()

    # Auto-generate default system NS record set (FQDN trailing dot)
    apex_name = zone.name if zone.name.endswith(".") else f"{zone.name}."
    ns_record = DnsRecord(
        hosted_zone_id=zone.id,
        name=apex_name,
        type="NS",
        ttl=172800,
        values_json=json.dumps(DEFAULT_NAMESERVERS),
        is_system=True,
    )
    db.add(ns_record)
    db.commit()
    db.refresh(zone)
    return zone


def get_hosted_zone(db: DBSession, zone_id: int) -> HostedZone | None:
    """Fetch a single zone with its records eagerly loaded."""
    return (
        db.query(HostedZone)
        .options(subqueryload(HostedZone.records))
        .filter(HostedZone.id == zone_id)
        .first()
    )


def update_hosted_zone(
    db: DBSession,
    zone_id: int,
    data: HostedZoneUpdate,
) -> HostedZone | None:
    """Partial-update a zone.  Only fields present in the request body are changed."""
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if zone is None:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(zone, field, value)

    zone.updated_at = datetime.utcnow()  # R2: explicit because onupdate doesn't fire in SQLite
    db.commit()
    db.refresh(zone)
    return zone


def delete_hosted_zone(db: DBSession, zone_id: int) -> bool:
    """Delete a zone and cascade-delete its records.  Returns ``False`` if not found."""
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if zone is None:
        return False
    db.delete(zone)
    db.commit()
    return True
