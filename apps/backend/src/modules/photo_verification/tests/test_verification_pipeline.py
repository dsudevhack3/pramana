from PIL import Image

from src.modules.photo_verification.services.verification_pipeline_service import (
    VerificationPipelineService,
)


def test_verification_pipeline_structure():
    image = Image.new(
        "RGB",
        (1200, 1600),
        "white",
    )

    result = VerificationPipelineService.analyze_image(
        image,
        doctor_name="Dr. Rahul Sharma",
        license_number="ABC12345",
        clinic_address="Main Road",
        patient_name="Test Patient",
        date="18/09/2026",
        drug_names=["Paracetamol"],
    )

    assert result.forensic is not None
    assert result.ai is not None
    assert result.text_consistency is not None
    assert result.layout is not None

    assert 0.0 <= result.ai.probability <= 1.0