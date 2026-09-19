import uuid
from enum import StrEnum

from sqlalchemy import Enum, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CandidateStatus(StrEnum):
    OPEN = "open"
    DISMISSED = "dismissed"
    ACTIONED = "actioned"   # admin took an enforcement action referencing this candidate


class TargetType(StrEnum):
    DOCTOR = "doctor"
    PHARMACY = "pharmacy"
    PATIENT = "patient"


class FlaggedCandidate(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Written ONLY by flagging_engine.py. No code path in this model or its
    repository ever sets a suspension/ban field — flagging/ has no
    authority to act, only to surface. admin/services/enforcement_service.py
    is the only consumer that transitions status to ACTIONED.
    """
    __tablename__ = "flagged_candidates"

    rule_name: Mapped[str] = mapped_column(String(100), nullable=False)
    target_type: Mapped[TargetType] = mapped_column(Enum(TargetType), nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    evidence: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[CandidateStatus] = mapped_column(
        Enum(CandidateStatus), default=CandidateStatus.OPEN, nullable=False
    )