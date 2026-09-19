from src.modules.photo_verification.services.risk_scoring_service import assess_risk


def test_all_checks_pass_is_low_risk() -> None:
    result = assess_risk(True, True, True, [])
    assert result.risk_level == "low"


def test_one_failed_check_is_medium_risk() -> None:
    result = assess_risk(False, True, True, [])
    assert result.risk_level == "medium"
    assert any("license" in reason for reason in result.reasons)


def test_two_failed_checks_is_high_risk() -> None:
    result = assess_risk(False, False, True, [])
    assert result.risk_level == "high"


def test_forensic_flag_alone_escalates_to_medium() -> None:
    result = assess_risk(True, True, True, ["EXIF metadata shows editing software: Photoshop"])
    assert result.risk_level == "medium"


def test_no_attempted_checks_is_medium_not_low() -> None:
    """
    Regression test for the bug found during development: when OCR
    couldn't extract enough to attempt ANY check, the result must be
    'insufficient data, needs review' (medium), never silently 'low
    risk' as if everything had been verified and passed.
    """
    result = assess_risk(None, None, None, [])
    assert result.risk_level == "medium"
    assert any("Insufficient data" in reason for reason in result.reasons)


def test_reasons_always_non_empty() -> None:
    result = assess_risk(True, True, True, [])
    assert len(result.reasons) > 0
