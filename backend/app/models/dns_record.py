"""DNS Record model."""

import json
from datetime import datetime

from sqlalchemy import (
    Boolean, Integer, String, Text, DateTime, ForeignKey,
    Index, UniqueConstraint, text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DnsRecord(Base):
    __tablename__ = "dns_records"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    hosted_zone_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("hosted_zones.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        String(253), nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(10), nullable=False  # A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
    )
    ttl: Mapped[int] = mapped_column(
        Integer, nullable=False, default=300
    )
    values_json: Mapped[str] = mapped_column(
        Text, nullable=False  # JSON array stored as text
    )
    is_system: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("0")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("(datetime('now'))")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("(datetime('now'))")
    )

    # ── Relationships ────────────────────────────────────
    hosted_zone: Mapped["HostedZone"] = relationship(
        "HostedZone", back_populates="records"
    )

    # ── Computed properties for Pydantic serialization ───
    @property
    def values(self) -> list:
        """Deserialize values_json into a Python list."""
        return json.loads(self.values_json) if self.values_json else []

    # ── Table-level constraints & indexes ────────────────
    __table_args__ = (
        UniqueConstraint(
            "hosted_zone_id", "name", "type",
            name="uq_dns_records_zone_name_type",
        ),
        Index("idx_dns_records_zone", "hosted_zone_id"),
        Index("idx_dns_records_zone_name", "hosted_zone_id", "name"),
        Index("idx_dns_records_zone_type", "hosted_zone_id", "type"),
    )

    def __repr__(self) -> str:
        return (
            f"<DnsRecord id={self.id} zone={self.hosted_zone_id} "
            f"name={self.name!r} type={self.type}>"
        )
