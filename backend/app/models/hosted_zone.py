"""Hosted Zone model."""

from datetime import datetime

from sqlalchemy import Integer, String, Text, DateTime, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    public_zone_id: Mapped[str] = mapped_column(
        String(16), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(
        String(253), nullable=False, index=True  # regular index, NOT unique
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    zone_type: Mapped[str] = mapped_column(
        String(10), default="PUBLIC"  # PUBLIC | PRIVATE
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("(datetime('now'))")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("(datetime('now'))")
    )

    # ── Relationships ────────────────────────────────────
    records: Mapped[list["DnsRecord"]] = relationship(
        "DnsRecord", back_populates="hosted_zone", cascade="all, delete-orphan"
    )

    # ── Computed properties for Pydantic serialization ───
    @property
    def record_count(self) -> int:
        """Number of DNS records in this zone."""
        return len(self.records) if self.records else 0

    def __repr__(self) -> str:
        return f"<HostedZone id={self.id} name={self.name!r} type={self.zone_type}>"
