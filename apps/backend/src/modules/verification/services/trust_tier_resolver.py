"""
Resolves the Trust Tier badge shown in Flow 3. Reads the FROZEN
point-in-time status stamped on the prescription at signing — never
re-derives from the doctor's current live status. This is what makes
"license status AT TIME OF SIGNING (not live status)" true.
"""
from src.modules.prescriptions.models.prescription import Prescription
from src.modules.verification.schemas.verification_schema import TrustTierResult

GOVT_VERIFIED_STATUSES = {"auto_approved"}
PLATFORM_VERIFIED_STATUSES = {"active"}


def resolve_trust_tier(prescription: Prescription) -> TrustTierResult:
    govt_verified = prescription.doctor_license_status_at_signing in GOVT_VERIFIED_STATUSES
    platform_verified = prescription.doctor_platform_status_at_signing in PLATFORM_VERIFIED_STATUSES
    org_affiliated = prescription.doctor_org_id_at_signing is not None

    if govt_verified and platform_verified and org_affiliated:
        label = "Fully Verified, Hospital-Affiliated"
    elif govt_verified and platform_verified:
        label = "Fully Verified, Independent Practice"
    elif govt_verified:
        label = "Doctor Verified, No Platform Provenance"
    else:
        label = "Unverified"

    return TrustTierResult(
        tier_label=label,
        govt_verified=govt_verified,
        platform_verified=platform_verified,
        org_affiliated=org_affiliated,
    )