from PIL import Image

from src.modules.photo_verification.services.layout_analysis_service import (
    LayoutAnalysisService,
)


def test_normal_prescription_layout():
    image = Image.new(
        "RGB",
        (1200, 1600),
        "white",
    )

    result = LayoutAnalysisService.analyze(
        image
    )

    assert result.score >= 0.0
    assert result.score <= 1.0
    assert result.status == "CONSISTENT"