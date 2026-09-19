from enum import StrEnum

from sqlalchemy import Enum, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PharmacyStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    SUSPENDED = "suspended"   # set by admin enforcement_service (Flow 5)
    REJECTED = "rejected"


class Pharmacy(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "pharmacies"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    license_number: Mapped[str] = mapped_column(String(100), nullable=False)
    state_council_name: Mapped[str] = mapped_column(String(255), nullable=False)

    address_raw: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    maps_place_id: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[PharmacyStatus] = mapped_column(
        Enum(PharmacyStatus), default=PharmacyStatus.PENDING, nullable=False
    )
    # Intentionally NO fields here for Aadhaar/eKYC or geotagged photo —
    # this tier is lighter-weight than doctor onboarding by design.