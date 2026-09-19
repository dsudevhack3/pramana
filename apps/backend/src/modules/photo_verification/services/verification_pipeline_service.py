from __future__ import annotations

from dataclasses import dataclass

from PIL import Image

from src.modules.photo_verification.services.ai_tampering_service import (
    AITamperingResult,
    AITamperingService,
)

from src.modules.photo_verification.services.forensic_analysis_service import (
    ForensicAnalysisResult,
    analyze as analyze_forensics,
)

from src.modules.photo_verification.services.layout_analysis_service import (
    LayoutAnalysisResult,
    LayoutAnalysisService,
)

from src.modules.photo_verification.services.text_consistency_service import (
    TextConsistencyResult,
    TextConsistencyService,
)


@dataclass(frozen=True)
class VerificationPipelineResult:
    """
    Combined result from all photo-verification engines.
    """

    forensic: ForensicAnalysisResult
    ai: AITamperingResult
    text_consistency: TextConsistencyResult
    layout: LayoutAnalysisResult


class VerificationPipelineService:
    """
    Unified prescription-photo analysis pipeline.

    Engines:

    1. Traditional forensic analysis
    2. Local AI image-forgery detection
    3. OCR/text consistency analysis
    4. Document layout analysis

    This service does not produce an absolute FAKE/REAL verdict.
    It only combines independent verification signals.
    """

    @classmethod
    def analyze_image(
        cls,
        image: Image.Image,
        *,
        doctor_name: str | None = None,
        license_number: str | None = None,
        clinic_address: str | None = None,
        patient_name: str | None = None,
        date: str | None = None,
        drug_names: list[str] | None = None,
    ) -> VerificationPipelineResult:

        # --------------------------------------------------
        # 1. FORENSIC ENGINE
        # --------------------------------------------------

        forensic_result = analyze_forensics(
            image
        )

        # --------------------------------------------------
        # 2. AI IMAGE-FORGERY ENGINE
        #
        # RGB + ELA -> M3
        # --------------------------------------------------

        ai_result = AITamperingService.predict(
            image
        )

        # --------------------------------------------------
        # 3. TEXT CONSISTENCY ENGINE
        # --------------------------------------------------

        text_result = TextConsistencyService.analyze(
            doctor_name=doctor_name,
            license_number=license_number,
            clinic_address=clinic_address,
            patient_name=patient_name,
            date=date,
            drug_names=drug_names,
        )

        # --------------------------------------------------
        # 4. DOCUMENT LAYOUT ENGINE
        # --------------------------------------------------

        layout_result = LayoutAnalysisService.analyze(
            image
        )

        # --------------------------------------------------
        # COMBINED RESULT
        # --------------------------------------------------

        return VerificationPipelineResult(
            forensic=forensic_result,
            ai=ai_result,
            text_consistency=text_result,
            layout=layout_result,
        )