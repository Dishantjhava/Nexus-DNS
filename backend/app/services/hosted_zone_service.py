import json
import math
import secrets
import string
from datetime import datetime

from sqlalchemy.orm import Session as DBSession, subqueryload

from app.models.dns_record import DnsRecord
from app.models.hosted_zone import HostedZone
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneUpdate

import re
from app.exceptions import AppException

DEFAULT_NAMESERVERS = [
    "ns-1.awsdns-clone.com",
    "ns-2.awsdns-clone.net",
    "ns-3.awsdns-clone.org",
    "ns-4.awsdns-clone.co.uk",
]


def validate_domain_name(name: str) -> str:
    """Validate domain name according to AWS Route 53 DNS rules."""
    if not name or not name.strip():
        raise AppException(400, "INVALID_DOMAIN_NAME", "Domain name is required.")

    clean_name = name.strip()

    if clean_name.startswith("."):
        raise AppException(400, "INVALID_DOMAIN_NAME", "Domain name cannot start with a dot.")

    if len(clean_name) > 253:
        raise AppException(400, "INVALID_DOMAIN_NAME", "Domain name cannot exceed 253 characters.")

    if ".." in clean_name:
        raise AppException(400, "INVALID_DOMAIN_NAME", "Domain name cannot contain consecutive dots.")

    normalized = clean_name[:-1] if clean_name.endswith(".") else clean_name
    labels = normalized.split(".")

    if len(labels) < 2:
        raise AppException(
            400,
            "INVALID_DOMAIN_NAME",
            "Invalid domain name format. Must include a top-level domain (e.g. example.com).",
        )

    for label in labels:
        if not label:
            raise AppException(400, "INVALID_DOMAIN_NAME", "Domain name labels cannot be empty.")
        if len(label) > 63:
            raise AppException(400, "INVALID_DOMAIN_NAME", "Domain name label cannot exceed 63 characters.")
        if label.startswith("-") or label.endswith("-"):
            raise AppException(400, "INVALID_DOMAIN_NAME", "Domain name labels cannot start or end with a hyphen.")
        if not re.match(r"^[a-zA-Z0-9-]+$", label):
            raise AppException(
                400,
                "INVALID_DOMAIN_NAME",
                f"Invalid characters in domain name label '{label}'. Valid characters: a-z, 0-9, and hyphens.",
            )

    return clean_name


def generate_public_zone_id() -> str:
    """Generate Route53-style hosted zone ID: Z + 13 uppercase alphanumeric chars."""
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(secrets.choice(chars) for _ in range(13))


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
    """Insert a new hosted zone and auto-create default system NS and SOA record sets."""
    data.name = validate_domain_name(data.name)

    # Duplicate check: check if hosted zone with exact same name and zone_type exists
    existing = db.query(HostedZone).filter(
        HostedZone.name.ilike(data.name),
        HostedZone.zone_type == data.zone_type,
    ).first()
    if existing:
        raise AppException(
            409,
            "HOSTED_ZONE_ALREADY_EXISTS",
            f"A hosted zone with the domain name '{data.name}' and type '{data.zone_type}' already exists.",
        )

    public_id = generate_public_zone_id()
    while db.query(HostedZone).filter(HostedZone.public_zone_id == public_id).first():
        public_id = generate_public_zone_id()

    zone = HostedZone(
        public_zone_id=public_id,
        name=data.name,
        description=data.description,
        zone_type=data.zone_type,
    )
    db.add(zone)
    db.flush()

    # Auto-generate default system NS & SOA record sets (FQDN trailing dot)
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

    soa_value = f"{DEFAULT_NAMESERVERS[0]}. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
    soa_record = DnsRecord(
        hosted_zone_id=zone.id,
        name=apex_name,
        type="SOA",
        ttl=900,
        values_json=json.dumps([soa_value]),
        is_system=True,
    )
    db.add(soa_record)

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
    """Partial-update a zone. Only description can be modified."""
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if zone is None:
        return None

    update_data = data.model_dump(exclude_unset=True)
    if "description" in update_data:
        zone.description = update_data["description"]

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
