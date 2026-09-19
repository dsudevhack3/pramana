import uuid
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, HashChainMixin, TimestampMixin, UUIDPrimaryKeyMixin


class PrescriptionStatus(StrEnum):
    ACTIVE = "active"
    AMENDED = "amended"   # superseded by a newer version in the chain
    VOIDED = "voided"


class Prescription(Base, UUIDPrimaryKeyMixin, TimestampMixin, HashChainMixin):
    """
    Append-only. No UPDATE permission exists at the DB role level
    (enforced by Postgres GRANT, sanity-checked at startup by
    core/db/session.py:assert_insert_only_role). An "amendment" is a NEW
    row that points back via previous_version_id — never a mutation of
    an existing row.
    """
    __tablename__ = "prescriptions"

    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)

    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)  # drug lines, dosage, etc — canonical source
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)

    # License/platform status STAMPED PERMANENTLY at signing time — never
    # re-derived live. This is the core provenance principle: downstream
    # checks read this frozen value, not the doctor's current status.
    doctor_license_status_at_signing: Mapped[str] = mapped_column(String(30), nullable=False)
    doctor_platform_status_at_signing: Mapped[str] = mapped_column(String(30), nullable=False)
    doctor_org_id_at_signing: Mapped[str | None] = mapped_column(String(64), nullable=True)

    status: Mapped[PrescriptionStatus] = mapped_column(
        Enum(PrescriptionStatus), default=PrescriptionStatus.ACTIVE, nullable=False
    )
    previous_version_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("prescriptions.id"), nullable=True
    )

    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)  # single-use QR/token value