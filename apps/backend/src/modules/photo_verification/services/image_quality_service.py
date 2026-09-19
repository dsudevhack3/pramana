"""
Step 1 of the photo verification workflow: reject/flag unreadable images
BEFORE any OCR or forensic analysis runs. A blurry or tiny image should
never be scored as "suspicious" for that reason — it should just be
rejected with a clear "retake the photo" message.
"""
from dataclasses import dataclass, field

import numpy as np
from PIL import Image
from scipy.signal import convolve2d

_MIN_WIDTH_PX = 800
_MIN_HEIGHT_PX = 600
_BLUR_VARIANCE_THRESHOLD = 50.0  # below this, Laplacian variance suggests a blurry image
# Document photos are inherently white-background-dominant (paper), so a
# high white-pixel ratio is NORMAL and must not be conflated with glare.
# Only flag genuinely extreme saturation — this threshold intentionally
# sits well above what a legitimate paper document produces.
_OVEREXPOSURE_WHITE_RATIO_THRESHOLD = 0.97


@dataclass
class ImageQualityResult:
    passed: bool
    issues: list[str] = field(default_factory=list)


def _laplacian_variance(gray_array: np.ndarray) -> float:
    """
    Approximates OpenCV's cv2.Laplacian(img, CV_64F).var() blur-detection
    technique without requiring the opencv-python dependency — a 3x3
    Laplacian kernel convolved via scipy (vectorized, not a per-pixel
    Python loop — a naive nested loop over a 400x400 image is slow
    enough to matter under real request load). Low variance means few
    sharp edges, i.e. a blurry image.
    """
    kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float64)
    laplacian = convolve2d(gray_array, kernel, mode="same", boundary="symm")
    return float(laplacian.var())


def check_image_quality(image: Image.Image) -> ImageQualityResult:
    issues: list[str] = []

    width, height = image.size
    if width < _MIN_WIDTH_PX or height < _MIN_HEIGHT_PX:
        issues.append(
            f"Resolution too low ({width}x{height}) — minimum "
            f"{_MIN_WIDTH_PX}x{_MIN_HEIGHT_PX} required for reliable OCR"
        )

    # Downscale before blur check for speed — blur detection doesn't need
    # full resolution, and the manual Laplacian loop above is O(pixels).
    small = image.convert("L").resize((min(width, 400), min(height, 400)))
    gray_array = np.asarray(small, dtype=np.float64)
    blur_variance = _laplacian_variance(gray_array)
    if blur_variance < _BLUR_VARIANCE_THRESHOLD:
        issues.append(
            f"Image appears blurry (sharpness score {blur_variance:.1f}, "
            f"minimum {_BLUR_VARIANCE_THRESHOLD})"
        )

    # Overexposure / glare check: flags only extreme, near-total saturation.
    # A document photo's white paper background naturally has a high
    # bright-pixel ratio — that is NOT glare, it's just paper. Only an
    # almost-entirely-blown-out frame (genuine glare washing out content)
    # should trip this.
    bright_pixel_ratio = float(np.mean(gray_array > 250))
    if bright_pixel_ratio > _OVEREXPOSURE_WHITE_RATIO_THRESHOLD:
        issues.append("Excessive glare/overexposure detected — content may be washed out")

    return ImageQualityResult(passed=len(issues) == 0, issues=issues)
