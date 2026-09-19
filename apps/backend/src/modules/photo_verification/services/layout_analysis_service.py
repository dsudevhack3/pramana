from __future__ import annotations

from dataclasses import dataclass

from PIL import Image


@dataclass(frozen=True)
class LayoutAnalysisResult:
    score: float
    status: str
    flags: list[str]

    @property
    def issues(self) -> list[str]:
        """
        Backward-compatible alias for older callers.
        """
        return self.flags


class LayoutAnalysisService:
    """
    Conservative document-layout analysis.

    This checks geometric properties only.
    It is not a trained document-layout model.
    """

    @staticmethod
    def analyze(
        image: Image.Image,
    ) -> LayoutAnalysisResult:

        flags: list[str] = []

        width, height = image.size

        if width <= 0 or height <= 0:
            return LayoutAnalysisResult(
                score=0.0,
                status="INVALID",
                flags=[
                    "Invalid image dimensions"
                ],
            )

        ratio = width / height

        score = 1.0

        # -----------------------------------------------------
        # Aspect ratio
        # -----------------------------------------------------

        if ratio < 0.50:
            score -= 0.30
            flags.append(
                "Image is unusually narrow"
            )

        elif ratio > 2.50:
            score -= 0.30
            flags.append(
                "Image is unusually wide"
            )

        # -----------------------------------------------------
        # Resolution
        # -----------------------------------------------------

        if width < 800 or height < 600:
            score -= 0.20
            flags.append(
                "Resolution may be insufficient for document analysis"
            )

        # -----------------------------------------------------
        # Final score
        # -----------------------------------------------------

        score = max(
            0.0,
            min(
                1.0,
                score,
            ),
        )

        # -----------------------------------------------------
        # Status
        # -----------------------------------------------------

        if score >= 0.80:
            status = "CONSISTENT"

        elif score >= 0.60:
            status = "PARTIAL"

        else:
            status = "ANOMALOUS"

        return LayoutAnalysisResult(
            score=round(score, 4),
            status=status,
            flags=flags,
        )