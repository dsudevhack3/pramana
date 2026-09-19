from enum import StrEnum

from sqlalchemy import Enum, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class OrganizationStatus(StrEnum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Organization(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    registration_number: Mapped[str] = mapped_column(String(100), nullable=False)  # CIN/GST/Shop Act
    registration_type: Mapped[str] = mapped_column(String(30), nullable=False)     # "CIN" | "GST" | "SHOP_ACT"

    address_raw: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    maps_place_id: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[OrganizationStatus] = mapped_column(
        Enum(OrganizationStatus), default=OrganizationStatus.PENDING, nullable=False
    )
    # NOTE: VERIFIED here means the ORG is real. It says nothing about any
    # doctor's individual verification — every doctor still runs the full
    # Flow 1 independently. Never use this status as a shortcut for
    # doctor trust anywhere in the codebase.