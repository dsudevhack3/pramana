import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PatientFlag(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Soft flag only — no ban path exists anywhere for patients. Written
    exclusively by admin/services/enforcement_service.py after reviewing
    a flagging_engine candidate; read by
    prescriptions/services/patient_risk_check_service.py as an advisory
    warning during Flow 2. The doctor always makes the final call.
    """
    __tablename__ = "patient_flags"

    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    rule_reason: Mapped[str] = mapped_column(String(1000), nullable=False)
    evidence_ref: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("flagged_candidates.id"), nullable=False
    )
    evidence: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_by_admin_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)  # admin can dismiss/expire a flag