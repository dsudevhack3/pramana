"""
Thin client over Setu/SurePass eKYC APIs. Never logs the raw Aadhaar
number — masking happens before this returns, not after.
"""
import httpx

from src.config.settings import get_settings
from src.core.exceptions.domain_exceptions import AadhaarVerificationFailed

settings = get_settings()


def mask_aadhaar(aadhaar_number: str) -> str:
    return f"XXXX-XXXX-{aadhaar_number[-4:]}"


class AadhaarClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.AADHAAR_PROVIDER_BASE_URL,
            headers={"Authorization": f"Bearer {settings.AADHAAR_PROVIDER_API_KEY}"},
            timeout=15.0,
        )

    async def initiate_consent_otp(self, aadhaar_number: str) -> str:
        """Returns a provider-side session/reference token, NOT the OTP."""
        resp = await self._client.post("/v1/ekyc/otp", json={"aadhaar_number": aadhaar_number})
        if resp.status_code != 200:
            raise AadhaarVerificationFailed("Failed to initiate Aadhaar OTP")
        return resp.json()["reference_token"]

    async def verify_otp(self, reference_token: str, otp: str) -> dict:
        resp = await self._client.post(
            "/v1/ekyc/verify", json={"reference_token": reference_token, "otp": otp}
        )
        if resp.status_code != 200:
            raise AadhaarVerificationFailed("OTP verification failed or expired")
        data = resp.json()
        return {
            "name": data["name"],
            "dob": data["dob"],
            "address": data.get("address"),
            "aadhaar_number": data["aadhaar_number"],  # discarded by caller after masking
        }