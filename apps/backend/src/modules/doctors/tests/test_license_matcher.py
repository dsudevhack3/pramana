from src.modules.doctors.services.license_matcher import MatchOutcome, match_identity


def test_exact_match_auto_approved():
    result = match_identity("John Smith", "1990-01-01", "John Smith", "1990-01-01")
    assert result == MatchOutcome.AUTO_APPROVED


def test_dob_mismatch_manual_review():
    result = match_identity("John Smith", "1990-01-01", "John Smith", "1991-01-01")
    assert result == MatchOutcome.MANUAL_REVIEW


def test_name_mismatch_rejected():
    result = match_identity("John Smith", "1990-01-01", "Completely Different Name", "1985-05-05")
    assert result == MatchOutcome.REJECTED