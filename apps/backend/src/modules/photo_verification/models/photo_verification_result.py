"""
Stores the outcome of an AI-assisted photo verification attempt.

This table is purely additive — it never modifies `prescriptions`,
`doctors`, or any other existing table. A photo verification result is
either linked to a matched platform prescription (Case A — strong path)
or stands alone with heuristic risk data (Case B — weak path).

IMPORTANT: `risk_level` is deliberately never "FAKE" / "REAL" — see
risk_scoring_service.py docstring for why a bare fake/real verdict is
never produced by this system.
"""
import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import JSON, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin


class VerificationCase(StrEnum):
    MATCHED_PLATFORM_RECORD = "matched_platform_record"
    NO_PLATFORM_MATCH = "no_platform_match"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERIFIED = "verified"


class ReviewStatus(StrEnum):
    NOT_REQUIRED = "not_required"
    PENDING_REVIEW = "pending_review"
    REVIEWED = "reviewed"


class PhotoVerificationResult(Base, TimestampMixin):
    __tablename__ = "photo_verification_results"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    uploaded_by_user_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
    )

    # --- Image reference (never store raw image bytes in this table) ---
    image_storage_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    # --- Step 1: quality gate ---
    image_quality_passed: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
    )

    image_quality_issues: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    # --- Step 2: OCR extraction ---
    extracted_doctor_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    extracted_license_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    extracted_clinic_address: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    extracted_drug_names: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    extracted_date: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    extracted_patient_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    ocr_field_confidence: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    # --- Step 3: platform cross-check ---
    verification_case: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    matched_prescription_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("prescriptions.id"),
        nullable=True,
    )

    # --- Step 4: external verification signals ---
    license_check_passed: Mapped[bool | None] = mapped_column(
        nullable=True,
    )

    clinic_check_passed: Mapped[bool | None] = mapped_column(
        nullable=True,
    )

    drug_check_passed: Mapped[bool | None] = mapped_column(
        nullable=True,
    )

    # --- Step 5: traditional forensic signals ---
    forensic_flags: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    ela_anomaly_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    # Detailed forensic signal groups.
    metadata_flags: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    timestamp_flags: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    dimension_flags: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    manipulation_flags: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    layout_flags: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    forensic_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    # --- Step 6: AI image-forgery model ---
    # Probability returned by the local M3 image forgery model.
    # 0.0 = low forgery signal, 1.0 = high forgery signal.
    ai_tampering_probability: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    # Possible values:
    # LOW_TAMPERING_SIGNAL
    # POSSIBLE_TAMPERING
    # AI_UNAVAILABLE
    ai_tampering_prediction: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    ai_model_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    ai_model_available: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
    )

    ai_error: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    # --- Step 7: OCR/text consistency analysis ---
    text_consistency_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )

    text_consistency_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="UNKNOWN",
    )

    text_consistency_flags: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    # --- Step 8: visual/layout consistency analysis ---
    layout_consistency_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )

    layout_consistency_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="UNKNOWN",
    )

    layout_consistency_flags: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    # --- Step 9: final result ---
    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    risk_reasons: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    review_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ReviewStatus.NOT_REQUIRED.value,
    )

    flagged_candidate_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
    )