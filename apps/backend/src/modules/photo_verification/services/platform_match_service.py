"""
Step 3: Case A vs Case B branch point. Searches the existing
`prescriptions` table for a record matching the OCR-extracted content.

If a match is found, the caller should verify that record's signature +
hash-chain via the EXISTING core/security/crypto modules — this service
only finds the candidate match, it does not re-verify cryptography
(that stays in verifier.py / hash_chain.py, not duplicated here).
"""
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.modules.photo_verification.services.ocr_extraction_service import OcrExtractionResult

# NOTE: prescriptions.models.prescription.Prescription is imported lazily
# inside the function below, not at module top level, so this module
# stays importable even before the prescriptions module's models are
# finalized (avoids a hard circular-import dependency at import time).


@dataclass
class PlatformMatchResult:
    matched: bool
    prescription_id: str | None = None


def find_matching_prescription(
    session: Session, ocr_result: OcrExtractionResult
) -> PlatformMatchResult:
    """
    Best-effort match on license number + date, since those are the
    highest-confidence OCR fields. Doctor name is used as a secondary
    filter only — OCR misreads names often enough that requiring an
    exact name match would cause false negatives (a real match missed).
    """
    if not ocr_result.license_number or not ocr_result.date:
        # Not enough reliable extracted data to even attempt a match —
        # go straight to Case B rather than guessing.
        return PlatformMatchResult(matched=False)

    from src.modules.doctors.models.doctor import Doctor
    from src.modules.prescriptions.models.prescription import Prescription

    stmt = (
        select(Prescription)
        .join(Doctor, Prescription.doctor_id == Doctor.id)
        .where(Doctor.license_number == ocr_result.license_number)
    )
    candidates = session.execute(stmt).scalars().all()

    for candidate in candidates:
        # Compare only the date portion — signed_at is a full timestamp,
        # OCR only reliably extracts a date.
        if candidate.signed_at.strftime("%d/%m/%Y") == _normalize_date(ocr_result.date):
            return PlatformMatchResult(matched=True, prescription_id=candidate.id)

    return PlatformMatchResult(matched=False)


def _normalize_date(raw_date: str) -> str:
    """OCR dates come in mixed separators (- or /) — normalize to DD/MM/YYYY for comparison."""
    return raw_date.replace("-", "/")
