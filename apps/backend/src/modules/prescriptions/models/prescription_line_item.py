"""
Denormalized copy of drug lines for querying (e.g. flagging_engine's
doctor-shopping check needs to filter by drug class fast — scanning JSONB
payloads for that is worse than a proper indexed column set). The JSONB
`payload` on Prescription remains the canonical signed source; these rows
are derived and rebuilt from it, never independently authoritative.
"""
import uuid

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, UUIDPrimaryKeyMixin


class PrescriptionLineItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "prescription_line_items"

    prescription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("prescriptions.id"), nullable=False
    )
    drug_name: Mapped[str] = mapped_column(String(255), nullable=False)
    drug_class: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g. "controlled_schedule_h1"
    is_controlled_substance: Mapped[bool] = mapped_column(default=False, nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)