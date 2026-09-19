import uuid
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DoctorLicenseStatus(StrEnum):
    PENDING = "pending"
    AUTO_APPROVED = "auto_approved"
    MANUAL_REVIEW = "manual_review"
    REJECTED = "rejected"
    REVOKED = "revoked"          # set by revocation_watcher (Flow 4)


class PlatformRegistrationStatus(StrEnum):
    NOT_REGISTERED = "not_registered"
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"      # set by admin enforcement_service (Flow 5)


class Doctor(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "doctors"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    license_number: Mapped[str] = mapped_column(String(100), nullable=False)
    council_name: Mapped[str] = mapped_column(String(255), nullable=False)
    license_status: Mapped[DoctorLicenseStatus] = mapped_column(
        Enum(DoctorLicenseStatus), default=DoctorLicenseStatus.PENDING, nullable=False
    )

    # Ed25519 public key, generated client-side in browser (Flow 1 Step 4).
    # Private key NEVER touches this server.
    signing_public_key: Mapped[str | None] = mapped_column(String(255), nullable=True)

    platform_status: Mapped[PlatformRegistrationStatus] = mapped_column(
        Enum(PlatformRegistrationStatus), default=PlatformRegistrationStatus.NOT_REGISTERED, nullable=False
    )

    # Optional — solo doctors keep this null. Accepting an org invite only
    # sets this FK; it never touches license_status or signing_public_key.
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True
    )

    # Set by admin/enforcement_service.py (Flow 5). Distinct from
    # license_status == REVOKED, which comes from the government registry,
    # not platform moderation. Both block new prescriptions but for
    # different reasons and are surfaced differently in the UI.
    is_suspended: Mapped[bool] = mapped_column(default=False, nullable=False)