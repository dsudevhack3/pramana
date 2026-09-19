"""
Photo forensic analysis.

Combines:
- EXIF metadata analysis
- timestamp analysis
- image dimensions
- JPEG ELA
- compression consistency signals
- visual/layout heuristics

These are forensic signals, not mathematical proof of fraud.
"""

import io
from dataclasses import dataclass, field
from datetime import datetime, timezone

import numpy as np
from PIL import ExifTags, Image

_ELA_JPEG_QUALITY = 90
_ELA_BLOCK_SIZE = 32

_MIN_WIDTH = 800
_MIN_HEIGHT = 600

_EDITING_SOFTWARE_KEYWORDS = (
    "photoshop",
    "gimp",
    "snapseed",
    "picsart",
    "lightroom",
    "canva",
    "paint.net",
)

_SUSPICIOUS_FORMATS = {
    "WEBP",
    "GIF",
}


@dataclass
class ForensicAnalysisResult:
    flags: list[str] = field(default_factory=list)
    ela_anomaly_score: float | None = None
    metadata_flags: list[str] = field(default_factory=list)
    timestamp_flags: list[str] = field(default_factory=list)
    dimension_flags: list[str] = field(default_factory=list)
    manipulation_flags: list[str] = field(default_factory=list)
    layout_flags: list[str] = field(default_factory=list)
    forensic_score: float = 0.0


def _extract_exif(image: Image.Image) -> dict:
    result: dict = {}

    try:
        exif = image.getexif()

        for tag_id, value in exif.items():
            tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
            result[tag_name] = value

    except Exception:
        pass

    return result


def _check_metadata(image: Image.Image) -> list[str]:
    flags: list[str] = []

    exif = _extract_exif(image)

    software = str(
        exif.get("Software", "")
    ).lower()

    processing_software = str(
        exif.get("ProcessingSoftware", "")
    ).lower()

    combined = f"{software} {processing_software}"

    for keyword in _EDITING_SOFTWARE_KEYWORDS:
        if keyword in combined:
            flags.append(
                f"Metadata indicates image processing software: {keyword}"
            )

    if image.format in _SUSPICIOUS_FORMATS:
        flags.append(
            f"Image format {image.format} may have undergone conversion"
        )

    return flags


def _check_timestamp(image: Image.Image) -> list[str]:
    flags: list[str] = []

    exif = _extract_exif(image)

    date_fields = (
        "DateTime",
        "DateTimeOriginal",
        "DateTimeDigitized",
    )

    timestamps = []

    for field_name in date_fields:
        value = exif.get(field_name)

        if value:
            try:
                parsed = datetime.strptime(
                    str(value),
                    "%Y:%m:%d %H:%M:%S",
                )

                timestamps.append(parsed)

            except (TypeError, ValueError):
                flags.append(
                    f"Invalid EXIF timestamp format in {field_name}"
                )

    if len(timestamps) >= 2:
        if len(set(timestamps)) > 1:
            flags.append(
                "EXIF capture timestamps are inconsistent"
            )

    if timestamps:
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        for timestamp in timestamps:
            if timestamp > now:
                flags.append(
                    "EXIF timestamp is in the future"
                )

    return flags


def _check_dimensions(image: Image.Image) -> list[str]:
    flags: list[str] = []

    width, height = image.size

    if width < _MIN_WIDTH or height < _MIN_HEIGHT:
        flags.append(
            f"Low image dimensions: {width}x{height}"
        )

    if width > 10000 or height > 10000:
        flags.append(
            f"Unusually large image dimensions: {width}x{height}"
        )

    aspect_ratio = width / height if height else 0

    if aspect_ratio < 0.25 or aspect_ratio > 4.0:
        flags.append(
            f"Unusual image aspect ratio: {aspect_ratio:.2f}"
        )

    return flags


def _compute_ela_map(image: Image.Image) -> np.ndarray:
    rgb = image.convert("RGB")

    buffer = io.BytesIO()
    rgb.save(
        buffer,
        format="JPEG",
        quality=_ELA_JPEG_QUALITY,
    )
    buffer.seek(0)

    recompressed = Image.open(buffer).convert("RGB")

    original_array = np.asarray(
        rgb,
        dtype=np.int16,
    )

    recompressed_array = np.asarray(
        recompressed,
        dtype=np.int16,
    )

    if original_array.shape != recompressed_array.shape:
        return np.zeros(
            original_array.shape[:2],
            dtype=np.float64,
        )

    diff = np.abs(
        original_array - recompressed_array
    )

    return diff.max(axis=2).astype(np.float64)


def _block_wise_anomaly_score(
    ela_map: np.ndarray,
) -> float:
    height, width = ela_map.shape

    block_means: list[float] = []

    for y in range(
        0,
        height - _ELA_BLOCK_SIZE + 1,
        _ELA_BLOCK_SIZE,
    ):
        for x in range(
            0,
            width - _ELA_BLOCK_SIZE + 1,
            _ELA_BLOCK_SIZE,
        ):
            block = ela_map[
                y:y + _ELA_BLOCK_SIZE,
                x:x + _ELA_BLOCK_SIZE,
            ]

            block_means.append(
                float(block.mean())
            )

    if len(block_means) < 2:
        return 0.0

    values = np.asarray(
        block_means,
        dtype=np.float64,
    )

    mean = values.mean()
    std = values.std()

    if std < 1e-6:
        return 0.0

    z_scores = np.abs(
        (values - mean) / std
    )

    return float(z_scores.max())


def _check_layout(image: Image.Image) -> list[str]:
    """
    Conservative layout heuristics.

    This is NOT a trained document-layout model.
    """

    flags: list[str] = []

    width, height = image.size

    if width == 0 or height == 0:
        flags.append("Invalid image layout")
        return flags

    ratio = width / height

    if ratio < 0.5 or ratio > 2.5:
        flags.append(
            "Unusual prescription document layout/aspect ratio"
        )

    return flags


def _calculate_score(
    metadata_flags: list[str],
    timestamp_flags: list[str],
    dimension_flags: list[str],
    manipulation_flags: list[str],
    layout_flags: list[str],
) -> float:
    score = 0.0

    score += len(metadata_flags) * 0.25
    score += len(timestamp_flags) * 0.20
    score += len(dimension_flags) * 0.10
    score += len(manipulation_flags) * 0.35
    score += len(layout_flags) * 0.10

    return min(score, 1.0)


def analyze(
    image: Image.Image,
) -> ForensicAnalysisResult:

    metadata_flags = _check_metadata(image)

    timestamp_flags = _check_timestamp(image)

    dimension_flags = _check_dimensions(image)

    layout_flags = _check_layout(image)

    ela_map = _compute_ela_map(image)

    ela_score = _block_wise_anomaly_score(
        ela_map
    )

    manipulation_flags: list[str] = []

    # ELA is supplementary evidence.
    # Do not call an image fake based on ELA alone.
    if ela_score >= 5.0:
        manipulation_flags.append(
            f"Localized compression anomaly detected "
            f"(ELA score {ela_score:.2f})"
        )

    all_flags = (
        metadata_flags
        + timestamp_flags
        + dimension_flags
        + manipulation_flags
        + layout_flags
    )

    forensic_score = _calculate_score(
        metadata_flags,
        timestamp_flags,
        dimension_flags,
        manipulation_flags,
        layout_flags,
    )

    return ForensicAnalysisResult(
        flags=all_flags,
        ela_anomaly_score=ela_score,
        metadata_flags=metadata_flags,
        timestamp_flags=timestamp_flags,
        dimension_flags=dimension_flags,
        manipulation_flags=manipulation_flags,
        layout_flags=layout_flags,
        forensic_score=forensic_score,
    )