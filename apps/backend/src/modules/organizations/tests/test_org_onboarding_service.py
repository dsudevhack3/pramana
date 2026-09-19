import pytest
from unittest.mock import AsyncMock

from src.modules.clinics.services.maps_verification_service import MapsVerificationResult
from src.modules.organizations.models.organization import OrganizationStatus
from src.modules.organizations.repository import OrganizationAdminRepository, OrganizationRepository
from src.modules.organizations.schemas.organization_schema import OrgSignupRequest
from src.modules.organizations.services.org_onboarding_service import OrgOnboardingService


@pytest.mark.asyncio
async def test_org_signup_stays_pending_regardless_of_success(db_session):
    registry_client = AsyncMock()
    registry_client.verify_registration.return_value = True
    maps = AsyncMock()
    maps.confirm_address.return_value = MapsVerificationResult("pid", 1.0, 1.0, "Addr")

    service = OrgOnboardingService(
        OrganizationRepository(db_session), OrganizationAdminRepository(db_session), registry_client, maps
    )
    org = await service.signup(OrgSignupRequest(
        name="Test Hospital", registration_number="CIN123", registration_type="CIN",
        address_raw="1 Hospital Rd", admin_email="admin@hospital.com",
        admin_password="pw123456", admin_full_name="Org Admin",
    ))
    # First-time orgs always require manual review — never auto-verified.
    assert org.status == OrganizationStatus.PENDING


@pytest.mark.asyncio
async def test_org_signup_raises_on_registry_failure(db_session):
    registry_client = AsyncMock()
    registry_client.verify_registration.return_value = False
    maps = AsyncMock()

    service = OrgOnboardingService(
        OrganizationRepository(db_session), OrganizationAdminRepository(db_session), registry_client, maps
    )
    with pytest.raises(ValueError, match="MCA/GST registry"):
        await service.signup(OrgSignupRequest(
            name="Fake Org", registration_number="BAD", registration_type="CIN",
            address_raw="addr", admin_email="a@a.com", admin_password="pw123456", admin_full_name="A",
        ))