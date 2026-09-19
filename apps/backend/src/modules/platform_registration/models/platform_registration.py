import uuid
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class RegistrationStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"


class PlatformRegistration(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Independent of govt verification, per workflow doc: a doctor can be
    govt-verified but NOT platform-registered — their prescriptions then
    carry no in-system provenance record. This table is the source of
    truth for that separate opt-in status; doctors.platform_status is a
    denormalized read-cache of it for fast lookups on the signing path.
    """
    __tablename__ = "platform_registrations"

    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id"), unique=True, nullable=False
    )
    status: Mapped[RegistrationStatus] = mapped_column(
        Enum(RegistrationStatus), default=RegistrationStatus.PENDING, nullable=False
    )