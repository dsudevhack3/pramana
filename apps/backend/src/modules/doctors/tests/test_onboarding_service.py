import pytest
from unittest.mock import AsyncMock

from src.modules.doctors.repository import DoctorRepository
from src.modules.doctors.schemas.doctor_schema import DoctorSignupRequest
from src.modules.doctors.services.onboarding_service import OnboardingService
from src.modules.identity.repository import IdentityRepository


@pytest.mark.asyncio
async def test_signup_creates_doctor(db_session):
    service = OnboardingService(DoctorRepository(db_session), IdentityRepository(db_session), AsyncMock())
    doctor = await service.signup(DoctorSignupRequest(email="new@example.com", password="pw123456", full_name="Dr. New"))
    assert doctor.email == "new@example.com"


@pytest.mark.asyncio
async def test_verify_license_without_identity_raises(db_session, sample_doctor):
    service = OnboardingService(DoctorRepository(db_session), IdentityRepository(db_session), AsyncMock())
    with pytest.raises(ValueError, match="Aadhaar eKYC"):
        await service.verify_license(str(sample_doctor.id), "LIC123", "Council X")