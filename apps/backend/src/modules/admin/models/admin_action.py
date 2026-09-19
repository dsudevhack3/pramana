import uuid
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, HashChainMixin, TimestampMixin, UUIDPrimaryKeyMixin
from src.modules.flagging.models.flagged_candidate import TargetType


class ActionType(StrEnum):
    SUSPEND_DOCTOR = "suspend_doctor"
    UNSUSPEND_DOCTOR = "unsuspend_doctor"
    SUSPEND_PHARMACY = "suspend_pharmacy"
    UNSUSPEND_PHARMACY = "unsuspend_pharmacy"
    FLAG_PATIENT = "flag_patient"          # soft flag, not a ban
    DISMISS_CANDIDATE = "dismiss_candidate"


class AdminAction(Base, UUIDPrimaryKeyMixin, TimestampMixin, HashChainMixin):
    """
    Signed with the admin's own key, appended to the SAME hash chain
    prescriptions use (hash_chain.py treats this table and Prescription
    as one interleaved sequence). This is what makes "moderation is
    provenance-tracked the same way a prescription is" literally true.
    """
    __tablename__ = "admin_actions"

    admin_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    action_type: Mapped[ActionType] = mapped_column(Enum(ActionType), nullable=False)
    target_type: Mapped[TargetType] = mapped_column(Enum(TargetType), nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    evidence_ref: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("flagged_candidates.id"), nullable=False
    )
    reason_note: Mapped[str | None] = mapped_column(String(1000), nullable=True)