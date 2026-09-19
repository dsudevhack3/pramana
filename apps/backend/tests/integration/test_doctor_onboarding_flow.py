"""Full Flow 1 happy path: Aadhaar -> license -> signing key -> platform registration."""
import pytest
from unittest.mock import AsyncMock

from src.core.security.crypto.keygen import generate_keypair
from src.modules.doctors.models.doctor import DoctorLicenseStatus, PlatformRegistrationStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.doctors.services.onboarding_service import OnboardingService
from src.modules.identity.repository import IdentityRepository
from src.modules.identity.services.identity_service import IdentityService


@pytest.mark.asyncio
async def test_full_onboarding_flow(db_session, sample_doctor):
    # Step 1: Aadhaar eKYC
    aadhaar_client = AsyncMock()
    aadhaar_client.verify_otp.return_value = {
        "name": "Dr. Test", "dob": "1985-03-15", "aadhaar_number": "999988887777",
    }
    identity_service = IdentityService(IdentityRepository(db_session), aadhaar_client)
    identity_result = await identity_service.verify_and_store(str(sample_doctor.id), "ref", "123456")
    assert identity_result.masked_aadhaar == "XXXX-XXXX-7777"

    # Step 2: License verification
    registry_client = AsyncMock()
    registry_client.lookup.return_value = {"name": "Dr. Test", "dob": "1985-03-15", "status": "active"}
    onboarding_service = OnboardingService(
        DoctorRepository(db_session), IdentityRepository(db_session), registry_client
    )
    outcome = await onboarding_service.verify_license(str(sample_doctor.id), "LIC999", "Karnataka Council")
    assert outcome == "auto_approved"

    # Step 4: Signing key
    keypair = generate_keypair()
    await onboarding_service.register_signing_key(str(sample_doctor.id), keypair.public_key_b64)

    # Step 5: Platform opt-in
    await onboarding_service.opt_into_platform(str(sample_doctor.id))

    doctor_repo = DoctorRepository(db_session)
    final_doctor = await doctor_repo.get_by_id(str(sample_doctor.id))
    assert final_doctor.license_status == DoctorLicenseStatus.AUTO_APPROVED
    assert final_doctor.platform_status == PlatformRegistrationStatus.PENDING
    assert final_doctor.signing_public_key == keypair.public_key_b64