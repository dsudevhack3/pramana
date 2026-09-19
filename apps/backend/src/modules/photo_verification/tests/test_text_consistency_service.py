from src.modules.photo_verification.services.text_consistency_service import (
    TextConsistencyService,
)


def test_text_normalization_similarity():
    score = TextConsistencyService.compare_text(
        "Dr. Rahul Sharma",
        "dr rahul sharma",
    )

    assert score > 0.80


def test_text_consistency_analysis():
    result = TextConsistencyService.analyze(
        doctor_name="Dr. Rahul Sharma",
        license_number="ABC12345",
        clinic_address="Main Road",
        patient_name="Test Patient",
        date="18/09/2026",
        drug_names=["Paracetamol"],
    )

    assert 0.0 <= result.score <= 1.0
    assert result.status in {
        "CONSISTENT",
        "PARTIAL",
        "LOW_CONFIDENCE",
    }