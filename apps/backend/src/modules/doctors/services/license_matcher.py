"""
Fuzzy-matches medical registry name+DOB against the Aadhaar-verified
name+DOB (Flow 1 Step 2). Threshold is configurable via settings so ops
can tune false-positive/negative rates without a code change.
"""
from rapidfuzz import fuzz

from src.config.settings import get_settings

settings = get_settings()


class MatchOutcome:
    AUTO_APPROVED = "auto_approved"
    MANUAL_REVIEW = "manual_review"
    REJECTED = "rejected"


def match_identity(
    aadhaar_name: str, aadhaar_dob: str, registry_name: str, registry_dob: str
) -> str:
    name_score = fuzz.token_sort_ratio(aadhaar_name.lower(), registry_name.lower()) / 100
    dob_matches = aadhaar_dob == registry_dob

    if dob_matches and name_score >= settings.LICENSE_NAME_DOB_FUZZY_MATCH_THRESHOLD:
        return MatchOutcome.AUTO_APPROVED
    if dob_matches and name_score >= 0.6:
        return MatchOutcome.MANUAL_REVIEW
    if not dob_matches and name_score >= settings.LICENSE_NAME_DOB_FUZZY_MATCH_THRESHOLD:
        return MatchOutcome.MANUAL_REVIEW
    return MatchOutcome.REJECTED