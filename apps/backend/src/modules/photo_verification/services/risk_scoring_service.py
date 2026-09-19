"""
Combines external verification, forensic, AI, text, and layout signals.

The system intentionally does not make an absolute FAKE/REAL claim.
It returns a risk classification with reasons.
"""

from dataclasses import dataclass

from src.modules.photo_verification.models.photo_verification_result import (
    RiskLevel,
)


@dataclass
class RiskAssessment:
    risk_level: str
    result: str
    score: float
    reasons: list[str]


def assess_risk(
    license_check_passed: bool | None,
    clinic_check_passed: bool | None,
    drug_check_passed: bool | None,
    forensic_flags: list[str],
    forensic_score: float = 0.0,
    text_consistency_score: float = 1.0,
    layout_consistency_score: float = 1.0,
    ai_tampering_probability: float | None = None,
    ai_model_available: bool = False,
) -> RiskAssessment:

    reasons: list[str] = []

    score = 0.0

    # ---------------------------------------------------------
    # 1. External verification signals
    # ---------------------------------------------------------

    external_checks = [
        ("license number", license_check_passed),
        ("clinic address", clinic_check_passed),
        ("drug information", drug_check_passed),
    ]

    attempted = 0
    failed = 0

    for label, passed in external_checks:

        if passed is None:
            continue

        attempted += 1

        if passed:
            reasons.append(
                f"{label.capitalize()} verification passed"
            )
        else:
            failed += 1
            score += 0.25
            reasons.append(
                f"{label.capitalize()} verification failed"
            )

    # ---------------------------------------------------------
    # 2. Traditional forensic evidence
    # ---------------------------------------------------------

    if forensic_flags:
        score += min(
            0.30,
            len(forensic_flags) * 0.10,
        )

        reasons.extend(forensic_flags)

    # ---------------------------------------------------------
    # 3. Traditional forensic score
    # ---------------------------------------------------------

    score += min(
        0.20,
        max(0.0, forensic_score) * 0.20,
    )

    # ---------------------------------------------------------
    # 4. AI image-tampering model
    # ---------------------------------------------------------

    if ai_model_available and ai_tampering_probability is not None:

        ai_probability = max(
            0.0,
            min(1.0, ai_tampering_probability),
        )

        # AI contributes at most 0.30 to the total risk score.
        ai_risk_contribution = ai_probability * 0.30
        score += ai_risk_contribution

        if ai_probability >= 0.70:
            reasons.append(
                "AI image-forgery model detected a strong tampering signal"
            )

        elif ai_probability >= 0.50:
            reasons.append(
                "AI image-forgery model detected a possible tampering signal"
            )

        elif ai_probability >= 0.30:
            reasons.append(
                "AI image-forgery model detected a moderate tampering signal"
            )

        else:
            reasons.append(
                "AI image-forgery model detected a low tampering signal"
            )

    elif not ai_model_available:
        reasons.append(
            "AI image-forgery model was unavailable; assessment uses available signals"
        )

    # ---------------------------------------------------------
    # 5. Text consistency
    # ---------------------------------------------------------

    if text_consistency_score < 0.60:
        score += 0.15
        reasons.append(
            "Low text consistency detected"
        )

    # ---------------------------------------------------------
    # 6. Layout consistency
    # ---------------------------------------------------------

    if layout_consistency_score < 0.60:
        score += 0.10
        reasons.append(
            "Unusual document layout detected"
        )

    # ---------------------------------------------------------
    # 7. Clamp final score
    # ---------------------------------------------------------

    score = min(
        max(score, 0.0),
        1.0,
    )

    # ---------------------------------------------------------
    # 8. Final risk classification
    # ---------------------------------------------------------

    # No independent verification and no traditional forensic
    # evidence means there is not enough evidence for a LOW result.
    if (
        attempted == 0
        and not forensic_flags
        and not ai_model_available
    ):
        risk_level = RiskLevel.MEDIUM.value
        result = "NEEDS_REVIEW"

        reasons.append(
            "Insufficient independent verification data"
        )

    elif failed >= 2:
        risk_level = RiskLevel.HIGH.value
        result = "SUSPICIOUS"

    elif score >= 0.60:
        risk_level = RiskLevel.HIGH.value
        result = "SUSPICIOUS"

    elif score >= 0.30:
        risk_level = RiskLevel.MEDIUM.value
        result = "NEEDS_REVIEW"

    else:
        risk_level = RiskLevel.LOW.value
        result = "CONSISTENT"

        if not reasons:
            reasons.append(
                "Available verification signals are consistent"
            )

    return RiskAssessment(
        risk_level=risk_level,
        result=result,
        score=round(score, 4),
        reasons=reasons,
    )