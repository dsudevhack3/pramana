from src.modules.identity.repository import IdentityRepository
from src.modules.identity.schemas.identity_schema import IdentityVerificationResult
from src.modules.identity.services.aadhaar_client import AadhaarClient, mask_aadhaar


class IdentityService:
    def __init__(self, repo: IdentityRepository, client: AadhaarClient) -> None:
        self._repo = repo
        self._client = client

    async def initiate_consent(self, doctor_id: str, aadhaar_number: str, consent_timestamp: str) -> str:
        """Returns provider reference token to use for OTP verification step."""
        return await self._client.initiate_consent_otp(aadhaar_number)

    async def verify_and_store(
        self, doctor_id: str, reference_token: str, otp: str
    ) -> IdentityVerificationResult:
        result = await self._client.verify_otp(reference_token, otp)
        masked = mask_aadhaar(result["aadhaar_number"])

        record = await self._repo.create(
            doctor_id=doctor_id,
            masked_aadhaar=masked,
            provider_reference_token=reference_token,
            verified_name=result["name"],
            verified_dob=result["dob"],
        )
        # raw aadhaar_number goes out of scope here — never persisted
        return IdentityVerificationResult(
            masked_aadhaar=masked,
            verified_name=record.verified_name,
            verified_dob=record.verified_dob,
            provider_reference_token=reference_token,
        )