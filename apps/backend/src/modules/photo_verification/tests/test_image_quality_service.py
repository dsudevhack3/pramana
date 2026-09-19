from PIL import Image, ImageDraw, ImageFilter

from src.modules.photo_verification.services.image_quality_service import check_image_quality


def _make_realistic_doc_image() -> Image.Image:
    img = Image.new("RGB", (1000, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    lines = [
        "Dr. Test Kumar - Reg No: MH12345",
        "Clinic: Sunrise Health Center, MG Road",
        "Patient: Ramesh Singh   Date: 15/09/2026",
        "Rx: Paracetamol 500mg - 1 tab BD x 5 days",
    ]
    y = 50
    for line in lines:
        draw.text((50, y), line, fill=(0, 0, 0))
        y += 60
    draw.rectangle([20, 20, 980, 780], outline=(0, 0, 0), width=3)
    return img


def test_clean_document_image_passes_quality_check() -> None:
    result = check_image_quality(_make_realistic_doc_image())
    assert result.passed
    assert result.issues == []


def test_tiny_image_fails_resolution_check() -> None:
    tiny = Image.new("RGB", (100, 100), color=(255, 255, 255))
    result = check_image_quality(tiny)
    assert not result.passed
    assert any("Resolution too low" in issue for issue in result.issues)


def test_heavily_blurred_image_fails_blur_check() -> None:
    blurred = _make_realistic_doc_image().filter(ImageFilter.GaussianBlur(radius=8))
    result = check_image_quality(blurred)
    assert not result.passed
    assert any("blurry" in issue for issue in result.issues)


def test_white_paper_background_is_not_flagged_as_glare() -> None:
    """
    Regression test for the overexposure-threshold bug found during
    development: a normal document photo (mostly white paper background)
    must NOT be flagged as glare just because most pixels are bright.
    """
    result = check_image_quality(_make_realistic_doc_image())
    assert not any("glare" in issue.lower() for issue in result.issues)
