import pytest
from unittest.mock import AsyncMock

from src.modules.clinics.services.maps_verification_service import MapsVerificationResult
from src.modules.pharmacies.models.pharmacy import PharmacyStatus
from src.modules.pharmacies.repository import PharmacyRepository
from src.modules.pharmacies.schemas.pharmacy_schema import PharmacySignupRequest
from src.modules.pharmacies.services.pharmacy_onboarding_service import PharmacyOnboardingService


@pytest.mark.asyncio
async def test_signup_creates_pending_pharmacy(db_session):
    maps = AsyncMock()
    maps.confirm_address.return_value = MapsVerificationResult("place1", 12.9, 77.6, "Addr")
    license_client = AsyncMock()
    license_client.verify_license_exists.return_value = True

    service = PharmacyOnboardingService(PharmacyRepository(db_session), maps, license_client)
    pharmacy = await service.signup(PharmacySignupRequest(
        name="Test Pharmacy", license_number="PH123", state_council_name="Karnataka Council",
        address_raw="123 Main St",
    ))
    assert pharmacy.status == PharmacyStatus.PENDING


@pytest.mark.asyncio
async def test_signup_raises_when_license_invalid(db_session):
    maps = AsyncMock()
    maps.confirm_address.return_value = MapsVerificationResult("place1", 12.9, 77.6, "Addr")
    license_client = AsyncMock()
    license_client.verify_license_exists.return_value = False

    service = PharmacyOnboardingService(PharmacyRepository(db_session), maps, license_client)
    with pytest.raises(ValueError, match="not found in state council registry"):
        await service.signup(PharmacySignupRequest(
            name="Test Pharmacy", license_number="INVALID", state_council_name="Karnataka Council",
            address_raw="123 Main St",
        ))