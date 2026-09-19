"""
Lightweight tier by design: license number + address + admin approval.
No Aadhaar eKYC, no geotagged photo — see workflow doc's explicit note
that pharmacists consume trust records rather than creating them.
"""
from src.modules.clinics.services.maps_verification_service import MapsVerificationService
from src.modules.pharmacies.models.pharmacy import PharmacyStatus
from src.modules.pharmacies.repository import PharmacyRepository
from src.modules.pharmacies.schemas.pharmacy_schema import PharmacySignupRequest
from src.modules.pharmacies.services.pharmacy_license_verification_client import (
    PharmacyLicenseVerificationClient,
)


class PharmacyOnboardingService:
    def __init__(
        self, repo: PharmacyRepository, maps: MapsVerificationService,
        license_client: PharmacyLicenseVerificationClient,
    ) -> None:
        self._repo = repo
        self._maps = maps
        self._license_client = license_client

    async def signup(self, body: PharmacySignupRequest):
        address_result = await self._maps.confirm_address(body.address_raw)
        if address_result is None:
            raise ValueError("Could not confirm pharmacy address via Google Maps")

        license_valid = await self._license_client.verify_license_exists(
            body.license_number, body.state_council_name
        )
        if not license_valid:
            raise ValueError("Pharmacy license number not found in state council registry")

        return await self._repo.create(
            name=body.name, license_number=body.license_number,
            state_council_name=body.state_council_name, address_raw=body.address_raw,
            place_id=address_result.place_id, lat=address_result.latitude, lng=address_result.longitude,
        )

    async def approve(self, pharmacy_id: str) -> None:
        """Admin approval — lightweight tier, distinct from Flow 5 enforcement approval flows."""
        await self._repo.set_status(pharmacy_id, PharmacyStatus.APPROVED)

    async def reject(self, pharmacy_id: str) -> None:
        await self._repo.set_status(pharmacy_id, PharmacyStatus.REJECTED)