import pytest

from src.modules.doctors.models.doctor import PlatformRegistrationStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.platform_registration.models.platform_registration import RegistrationStatus
from src.modules.platform_registration.repository import PlatformRegistrationRepository
from src.modules.platform_registration.services.registration_service import RegistrationService


@pytest.mark.asyncio
async def test_opt_in_sets_pending(db_session, sample_doctor):
    service = RegistrationService(PlatformRegistrationRepository(db_session), DoctorRepository(db_session))
    await service.opt_in(str(sample_doctor.id))

    status = await service.get_status(str(sample_doctor.id))
    assert status == RegistrationStatus.PENDING


@pytest.mark.asyncio
async def test_approve_sets_active_independent_of_govt_verification(db_session, sample_doctor):
    """A doctor can be platform-ACTIVE regardless of govt license_status — the two are independent axes."""
    service = RegistrationService(PlatformRegistrationRepository(db_session), DoctorRepository(db_session))
    doctor_repo = DoctorRepository(db_session)

    await service.opt_in(str(sample_doctor.id))
    await service.approve(str(sample_doctor.id))

    doctor = await doctor_repo.get_by_id(str(sample_doctor.id))
    assert doctor.platform_status == PlatformRegistrationStatus.ACTIVE