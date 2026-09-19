from pydantic import BaseModel, Field


class AadhaarConsentRequest(BaseModel):
    doctor_id: str
    aadhaar_number: str = Field(..., min_length=12, max_length=12, pattern=r"^\d{12}$")
    consent_acknowledged: bool


class AadhaarOtpVerifyRequest(BaseModel):
    doctor_id: str
    otp: str = Field(..., min_length=6, max_length=6)


class IdentityVerificationResult(BaseModel):
    masked_aadhaar: str
    verified_name: str
    verified_dob: str
    provider_reference_token: str