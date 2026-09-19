import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class LicenseStatusHistory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Append-only log of license_status transitions. Read by
    revocation_watcher's own audit and by admin ledger views —
    lets support answer "when exactly did this doctor's license flip?"
    """
    __tablename__ = "license_status_history"

    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    previous_status: Mapped[str] = mapped_column(String(30), nullable=False)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)  # "medical_registry_client" | "admin"