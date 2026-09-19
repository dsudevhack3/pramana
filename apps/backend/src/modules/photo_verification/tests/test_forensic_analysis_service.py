from PIL import Image, ImageDraw

from src.modules.photo_verification.services.forensic_analysis_service import analyze


def _make_doc_image() -> Image.Image:
    img = Image.new("RGB", (1000, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((50, 50), "Dr. Test Kumar - Reg No: MH12345", fill=(0, 0, 0))
    draw.rectangle([20, 20, 980, 780], outline=(0, 0, 0), width=3)
    return img


def test_clean_image_produces_no_auto_flags() -> None:
    """
    Regression test for the false-positive bug found during development:
    naive ELA z-scoring flagged clean text-dense images as anomalous.
    The fix removed ELA-only auto-flagging entirely — only EXIF
    editing-software evidence should ever produce a flag.
    """
    result = analyze(_make_doc_image())
    assert result.flags == []


def test_ela_score_is_still_computed_and_returned() -> None:
    """Score is informational (for admin evidence panels) even though it no longer auto-flags."""
    result = analyze(_make_doc_image())
    assert result.ela_anomaly_score is not None
    assert result.ela_anomaly_score >= 0.0


def test_exif_editing_software_is_flagged() -> None:
    """This IS a reliable signal (simple substring match) and should still auto-flag."""
    from src.modules.photo_verification.services.forensic_analysis_service import (
        _check_exif_metadata,
    )

    class _FakeExif(dict):
        pass

    class _FakeImage:
        def getexif(self):
            # PIL's ExifTags.TAGS[305] == "Software"
            return _FakeExif({305: "Adobe Photoshop 24.0"})

    flags = _check_exif_metadata(_FakeImage())
    assert any("Photoshop" in flag for flag in flags)


def test_no_exif_does_not_flag() -> None:
    """Absence of EXIF proves nothing and must not be treated as suspicious."""
    result = analyze(_make_doc_image())
    assert not any("EXIF" in flag for flag in result.flags)
