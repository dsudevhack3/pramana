from PIL import Image

from src.modules.photo_verification.services.ai_tampering_service import (
    AITamperingService,
)


def test_ai_tampering_service_result_structure():
    image = Image.new(
        "RGB",
        (1000, 800),
        "white",
    )

    result = AITamperingService.predict(
        image
    )

    assert result.model_name == "M3-image-forgery"

    assert isinstance(
        result.probability,
        float,
    )

    assert 0.0 <= result.probability <= 1.0

    assert result.prediction in {
        "POSSIBLE_TAMPERING",
        "LOW_TAMPERING_SIGNAL",
        "AI_UNAVAILABLE",
    }

    assert isinstance(
        result.model_available,
        bool,
    )

    if result.model_available:
        assert result.error is None

    else:
        assert result.prediction == "AI_UNAVAILABLE"
        assert result.error is not None