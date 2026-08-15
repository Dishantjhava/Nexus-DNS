"""Seed the database with a demo user and realistic hosted zones + DNS records.

Usage (from the backend/ directory):
    python seed.py

Creates:
  - 1 user:  admin / admin123
  - 5 hosted zones with 7-10 varied records each
"""

import json
import sys
from pathlib import Path

# Ensure the backend package is importable when running as a script
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.auth_service import hash_password

from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.session import Session  # noqa: F401 — register table
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DnsRecord
from app.services.hosted_zone_service import generate_public_zone_id


# ── Seed data ────────────────────────────────────────────

ZONES = [
    # ── Zone 1: classic company domain ───────────────────
    {
        "name": "example.com",
        "description": "Primary company domain",
        "zone_type": "PUBLIC",
        "records": [
            {"name": "example.com",      "type": "A",     "ttl": 300,   "values": ["93.184.216.34"]},
            {"name": "example.com",      "type": "AAAA",  "ttl": 300,   "values": ["2606:2800:220:1:248:1893:25c8:1946"]},
            {"name": "www.example.com",  "type": "CNAME", "ttl": 300,   "values": ["example.com"]},
            {"name": "example.com",      "type": "MX",    "ttl": 3600,  "values": [
                {"priority": 10, "exchange": "mail.example.com"},
                {"priority": 20, "exchange": "mail2.example.com"},
            ]},
            {"name": "example.com",      "type": "TXT",   "ttl": 3600,  "values": ["v=spf1 include:_spf.example.com ~all"]},
            {"name": "example.com",      "type": "NS",    "ttl": 86400, "values": ["ns1.example.com", "ns2.example.com"]},
            {"name": "mail.example.com", "type": "A",     "ttl": 300,   "values": ["93.184.216.35"]},
        ],
    },

    # ── Zone 2: SaaS startup ────────────────────────────
    {
        "name": "acme-corp.io",
        "description": "SaaS platform infrastructure",
        "zone_type": "PUBLIC",
        "records": [
            {"name": "acme-corp.io",       "type": "A",     "ttl": 300,  "values": ["104.21.45.67", "104.21.45.68"]},
            {"name": "www.acme-corp.io",   "type": "CNAME", "ttl": 300,  "values": ["acme-corp.io"]},
            {"name": "docs.acme-corp.io",  "type": "CNAME", "ttl": 300,  "values": ["acme-corp.gitbook.io"]},
            {"name": "api.acme-corp.io",   "type": "A",     "ttl": 60,   "values": ["104.21.45.70"]},
            {"name": "acme-corp.io",       "type": "MX",    "ttl": 3600, "values": [
                {"priority": 1, "exchange": "aspmx.l.google.com"},
                {"priority": 5, "exchange": "alt1.aspmx.l.google.com"},
            ]},
            {"name": "acme-corp.io",       "type": "TXT",   "ttl": 3600, "values": ["v=spf1 include:_spf.google.com ~all"]},
            {"name": "_dmarc.acme-corp.io","type": "TXT",   "ttl": 3600, "values": ["v=DMARC1; p=reject; rua=mailto:dmarc@acme-corp.io"]},
            {"name": "_sip._tcp.acme-corp.io", "type": "SRV", "ttl": 300, "values": [
                {"priority": 10, "weight": 60, "port": 5060, "target": "sip.acme-corp.io"},
            ]},
        ],
    },

    # ── Zone 3: e-commerce ──────────────────────────────
    {
        "name": "mystore.shop",
        "description": "E-commerce storefront",
        "zone_type": "PUBLIC",
        "records": [
            {"name": "mystore.shop",          "type": "A",     "ttl": 300,  "values": ["151.101.1.195", "151.101.65.195"]},
            {"name": "www.mystore.shop",      "type": "CNAME", "ttl": 300,  "values": ["mystore.shop"]},
            {"name": "cdn.mystore.shop",      "type": "CNAME", "ttl": 60,   "values": ["d3abc123.cloudfront.net"]},
            {"name": "checkout.mystore.shop", "type": "A",     "ttl": 60,   "values": ["151.101.1.196"]},
            {"name": "mystore.shop",          "type": "MX",    "ttl": 3600, "values": [
                {"priority": 10, "exchange": "mx1.emailsrvr.com"},
                {"priority": 20, "exchange": "mx2.emailsrvr.com"},
            ]},
            {"name": "mystore.shop",          "type": "TXT",   "ttl": 3600, "values": ["v=spf1 include:emailsrvr.com ~all"]},
            {"name": "mystore.shop",          "type": "CAA",   "ttl": 3600, "values": [
                {"flag": 0, "tag": "issue", "value": "letsencrypt.org"},
            ]},
            {"name": "mystore.shop",          "type": "AAAA",  "ttl": 300,  "values": ["2606:4700:3030::6815:1001"]},
        ],
    },

    # ── Zone 4: private / internal ──────────────────────
    {
        "name": "internal.dev",
        "description": "Internal service discovery",
        "zone_type": "PRIVATE",
        "records": [
            {"name": "db-primary.internal.dev",  "type": "A",   "ttl": 60,    "values": ["10.0.1.100"]},
            {"name": "db-replica.internal.dev",  "type": "A",   "ttl": 60,    "values": ["10.0.1.101"]},
            {"name": "redis.internal.dev",       "type": "A",   "ttl": 60,    "values": ["10.0.1.200"]},
            {"name": "cache.internal.dev",       "type": "CNAME","ttl": 60,   "values": ["redis.internal.dev"]},
            {"name": "_mongodb._tcp.internal.dev","type": "SRV","ttl": 60,    "values": [
                {"priority": 0, "weight": 5, "port": 27017, "target": "db-primary.internal.dev"},
            ]},
            {"name": "100.1.0.10.in-addr.arpa",  "type": "PTR","ttl": 3600,  "values": ["db-primary.internal.dev"]},
            {"name": "internal.dev",              "type": "NS",  "ttl": 86400,"values": ["ns1.internal.dev", "ns2.internal.dev"]},
            {"name": "internal.dev",              "type": "TXT", "ttl": 300,  "values": ["internal use only"]},
            {"name": "grafana.internal.dev",      "type": "A",   "ttl": 60,   "values": ["10.0.2.50"]},
            {"name": "prometheus.internal.dev",   "type": "A",   "ttl": 60,   "values": ["10.0.2.51"]},
        ],
    },

    # ── Zone 5: CDN provider ────────────────────────────
    {
        "name": "globalcdn.net",
        "description": "Global CDN edge network",
        "zone_type": "PUBLIC",
        "records": [
            {"name": "edge-us.globalcdn.net",  "type": "A",    "ttl": 30,    "values": ["198.51.100.1", "198.51.100.2"]},
            {"name": "edge-eu.globalcdn.net",  "type": "A",    "ttl": 30,    "values": ["198.51.100.10", "198.51.100.11"]},
            {"name": "edge-us.globalcdn.net",  "type": "AAAA", "ttl": 30,    "values": ["2001:db8:1::1", "2001:db8:1::2"]},
            {"name": "edge-eu.globalcdn.net",  "type": "AAAA", "ttl": 30,    "values": ["2001:db8:2::1", "2001:db8:2::2"]},
            {"name": "www.globalcdn.net",      "type": "CNAME","ttl": 300,   "values": ["globalcdn.net"]},
            {"name": "globalcdn.net",          "type": "NS",   "ttl": 86400, "values": ["ns1.globalcdn.net", "ns2.globalcdn.net", "ns3.globalcdn.net"]},
            {"name": "globalcdn.net",          "type": "CAA",  "ttl": 3600,  "values": [
                {"flag": 0, "tag": "issue", "value": "digicert.com"},
                {"flag": 0, "tag": "issuewild", "value": "digicert.com"},
            ]},
            {"name": "globalcdn.net",          "type": "MX",   "ttl": 3600,  "values": [
                {"priority": 10, "exchange": "mail.globalcdn.net"},
            ]},
        ],
    },
]


def seed():
    """Drop all tables, recreate, and populate with demo data."""
    print("Dropping and recreating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Demo users ────────────────────────────────────
        admin = User(
            username="admin",
            password_hash=hash_password("admin123"),
        )
        admin_email = User(
            username="admin@gmail.com",
            password_hash=hash_password("admin123"),
        )
        db.add(admin)
        db.add(admin_email)
        db.flush()
        print(f"  Created users: admin & admin@gmail.com (password: admin123)")

        # ── Hosted zones + records ───────────────────────
        total_records = 0
        default_ns = [
            "ns-1.awsdns-clone.com",
            "ns-2.awsdns-clone.net",
            "ns-3.awsdns-clone.org",
            "ns-4.awsdns-clone.co.uk",
        ]
        for zone_data in ZONES:
            zone = HostedZone(
                public_zone_id=generate_public_zone_id(),
                name=zone_data["name"],
                description=zone_data["description"],
                zone_type=zone_data["zone_type"],
            )
            db.add(zone)
            db.flush()  # get zone.id for FK

            # Auto-generated system NS & SOA records (FQDN trailing dot)
            apex_name = zone.name if zone.name.endswith(".") else f"{zone.name}."
            sys_ns = DnsRecord(
                hosted_zone_id=zone.id,
                name=apex_name,
                type="NS",
                ttl=172800,
                values_json=json.dumps(default_ns),
                is_system=True,
            )
            db.add(sys_ns)

            soa_val = f"{default_ns[0]}. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
            sys_soa = DnsRecord(
                hosted_zone_id=zone.id,
                name=apex_name,
                type="SOA",
                ttl=900,
                values_json=json.dumps([soa_val]),
                is_system=True,
            )
            db.add(sys_soa)
            record_count = 2

            for rec in zone_data["records"]:
                # Avoid duplicate NS at apex if zone_data already defines one
                if rec["type"] == "NS" and rec["name"] == zone.name:
                    continue
                record = DnsRecord(
                    hosted_zone_id=zone.id,
                    name=rec["name"],
                    type=rec["type"],
                    ttl=rec["ttl"],
                    values_json=json.dumps(rec["values"]),
                    is_system=rec.get("is_system", False),
                )
                db.add(record)
                record_count += 1

            total_records += record_count
            print(
                f"  Created zone: {zone.name:<20s} "
                f"({zone.zone_type:<7s}, {record_count} records)"
            )

        db.commit()
        print(f"\nDatabase seeded successfully!")
        print(f"  Zones:   {len(ZONES)}")
        print(f"  Records: {total_records}")
        print(f"  Login:   admin / admin123")

    except Exception as e:
        db.rollback()
        print(f"\nSeeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
