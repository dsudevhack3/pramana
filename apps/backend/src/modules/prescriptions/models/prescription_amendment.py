import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PrescriptionAmendment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Audit trail of WHY an amendment happened, linking old -> new
    prescription rows. The new row itself is a normal, independently
    signed Prescription — this table just records the reason and lineage
    for display in Flow 3's "if amended, shows lineage" step.
    """
    __tablename__ = "prescription_amendments"

    original_prescription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("prescriptions.id"), nullable=False
    )
    new_prescription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("prescriptions.id"), nullable=False
    )
    reason: Mapped[str] = mapped_column(String(1000), nullable=False)