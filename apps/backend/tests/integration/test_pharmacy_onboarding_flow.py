"""Full Flow 0.5: pharmacy signup -> admin approval -> pharmacist creation -> scan-and-consume eligibility."""
import pytest
from unittest.mock import AsyncMock

from src.modules.clinics.services.maps_verification_service import MapsVerificationResult
from src.modules.pharmacies.repository import PharmacistRepository, PharmacyRepository
from src.modules.pharmacies.schemas.pharmacist_schema import PharmacistSignupRequest
from src.modules.pharmacies.schemas.pharmacy_schema import PharmacySignupRequest
from src.modules.pharmacies.services.pharmacist_account_service import PharmacistAccountService
from src.modules.pharmacies.services.pharmacy_onboarding_service import PharmacyOnboardingService


@pytest.mark.asyncio
async def test_full_pharmacy_onboarding_flow(db_session):
    maps = AsyncMock()
    maps.confirm_address.return_value = MapsVerificationResult("pid1", 12.9, 77.6, "Addr")
    license_client = AsyncMock()
    license_client.verify_license_exists.return_value = True

    pharmacy_repo = PharmacyRepository(db_session)
    onboarding_service = PharmacyOnboardingService(pharmacy_repo, maps, license_client)

    pharmacy = await onboarding_service.signup(PharmacySignupRequest(
        name="City Pharmacy", license_number="PH555", state_council_name="Karnataka Council",
        address_raw="55 Market St",
    ))
    await onboarding_service.approve(str(pharmacy.id))

    pharmacist_repo = PharmacistRepository(db_session)
    account_service = PharmacistAccountService(pharmacist_repo, pharmacy_repo)
    pharmacist = await account_service.create_pharmacist(PharmacistSignupRequest(
        email="pharmacist@city.com", password="pw123456", full_name="P. Kumar",
        pharmacy_id=str(pharmacy.id),
    ))

    can_scan = await account_service.can_scan_and_consume(str(pharmacist.id))
    assert can_scan is True