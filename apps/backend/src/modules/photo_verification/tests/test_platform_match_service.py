from src.modules.photo_verification.services.ocr_extraction_service import OcrExtractionResult
from src.modules.photo_verification.services.platform_match_service import (
    find_matching_prescription,
)


class _FakeSession:
    """
    Minimal fake standing in for a SQLAlchemy Session — the real
    integration test (against an actual DB with real Doctor/Prescription
    rows) belongs in tests/integration/ once the doctors and
    prescriptions modules' models are finalized; this unit test only
    verifies the early-return guard logic that doesn't need a real DB.
    """

    def execute(self, *args, **kwargs):
        raise AssertionError("execute() should not be called when OCR data is insufficient")


def test_returns_no_match_when_license_number_missing() -> None:
    ocr_result = OcrExtractionResult(license_number=None, date="15/09/2026")
    result = find_matching_prescription(_FakeSession(), ocr_result)
    assert result.matched is False
    assert result.prescription_id is None


def test_returns_no_match_when_date_missing() -> None:
    ocr_result = OcrExtractionResult(license_number="MH12345", date=None)
    result = find_matching_prescription(_FakeSession(), ocr_result)
    assert result.matched is False


def test_normalize_date_handles_mixed_separators() -> None:
    from src.modules.photo_verification.services.platform_match_service import _normalize_date

    assert _normalize_date("15-09-2026") == "15/09/2026"
    assert _normalize_date("15/09/2026") == "15/09/2026"
