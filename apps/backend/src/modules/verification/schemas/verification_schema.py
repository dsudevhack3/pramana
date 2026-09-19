from pydantic import BaseModel


class VerificationLookupRequest(BaseModel):
    token_or_id: str


class TrustTierResult(BaseModel):
    tier_label: str  # e.g. "Fully Verified, Hospital-Affiliated"
    govt_verified: bool
    platform_verified: bool
    org_affiliated: bool


class VerificationResponse(BaseModel):
    prescription_id: str
    doctor_name: str
    doctor_license_status_at_signing: str
    trust_tier: TrustTierResult
    drug_lines: list[dict]
    signature_valid: bool
    hash_chain_intact: bool
    is_amended: bool
    latest_version_id: str


class ConsumeTokenRequest(BaseModel):
    token: str
    pharmacist_id: str