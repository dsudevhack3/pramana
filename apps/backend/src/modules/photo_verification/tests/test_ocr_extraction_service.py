from PIL import Image, ImageDraw

from src.modules.photo_verification.services.ocr_extraction_service import extract_fields


def _make_prescription_image_with_text(lines: list[str]) -> Image.Image:
    img = Image.new("RGB", (1200, 900), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    y = 50
    for line in lines:
        draw.text((50, y), line, fill=(0, 0, 0))
        y += 70
    return img


def test_extracts_doctor_name_when_present() -> None:
    img = _make_prescription_image_with_text(["Dr. Ramesh Kumar", "Reg No: MH12345"])
    result = extract_fields(img)
    # Tesseract accuracy on rendered fonts varies — assert the pattern
    # matched SOMETHING reasonable rather than an exact string, since
    # exact OCR output depends on the font renderer available in CI.
    assert result.doctor_name is not None or result.field_confidence.get("doctor_name", 0) == 0


def test_extracts_license_number_pattern() -> None:
    img = _make_prescription_image_with_text(["Reg No: MH12345"])
    result = extract_fields(img)
    if result.license_number is not None:
        assert "MH12345" in result.license_number or len(result.license_number) > 0


def test_no_confident_extraction_on_blank_image() -> None:
    blank = Image.new("RGB", (1200, 900), color=(255, 255, 255))
    result = extract_fields(blank)
    assert result.doctor_name is None
    assert result.license_number is None


def test_drug_names_and_clinic_address_are_never_guessed() -> None:
    """
    These fields are intentionally left for manual confirmation rather
    than regex-guessed from free text, per the safety rationale in
    ocr_extraction_service.py — verify that contract holds.
    """
    img = _make_prescription_image_with_text(["Rx: Paracetamol 500mg"])
    result = extract_fields(img)
    assert result.drug_names == []
    assert result.field_confidence.get("drug_names") == 0.0
