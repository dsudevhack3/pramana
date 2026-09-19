"""
Stores ONLY masked Aadhaar + provider reference token — never raw Aadhaar
number, per the workflow doc's explicit privacy requirement. The provider
(Setu/SurePass) holds the raw data on their side; we hold a pointer.
"""
import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class IdentityRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "identity_records"

    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id"), unique=True, nullable=False
    )
    masked_aadhaar: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "XXXX-XXXX-1234"
    provider_reference_token: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(50), nullable=False)  # "setu" | "surepass"
    verified_name: Mapped[str] = mapped_column(String(255), nullable=False)
    verified_dob: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    consent_given_at: Mapped[str] = mapped_column(String(30), nullable=False)  # ISO timestamp, immutable