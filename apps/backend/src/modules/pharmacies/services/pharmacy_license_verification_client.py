"""
State pharmacy council registry check — analogous to
medical_registry_client.py but for pharmacy licenses. No fuzzy-match
identity step here (no Aadhaar collected for pharmacies), just a
license-number-exists check.
"""
import httpx

from src.config.settings import get_settings

settings = get_settings()


class PharmacyLicenseVerificationClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.PHARMACY_COUNCIL_REGISTRY_BASE_URL,
            headers={"Authorization": f"Bearer {settings.PHARMACY_COUNCIL_REGISTRY_API_KEY}"},
            timeout=15.0,
        )

    async def verify_license_exists(self, license_number: str, council_name: str) -> bool:
        resp = await self._client.get(
            "/v1/registry/lookup", params={"license_number": license_number, "council": council_name}
        )
        return resp.status_code == 200