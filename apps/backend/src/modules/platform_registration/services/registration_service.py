from src.modules.doctors.models.doctor import PlatformRegistrationStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.platform_registration.models.platform_registration import RegistrationStatus
from src.modules.platform_registration.repository import PlatformRegistrationRepository


class RegistrationService:
    def __init__(self, repo: PlatformRegistrationRepository, doctor_repo: DoctorRepository) -> None:
        self._repo = repo
        self._doctor_repo = doctor_repo

    async def opt_in(self, doctor_id: str) -> None:
        await self._repo.create_or_reset(doctor_id, RegistrationStatus.PENDING)
        await self._doctor_repo.set_platform_status(doctor_id, PlatformRegistrationStatus.PENDING)

    async def approve(self, doctor_id: str) -> None:
        """Admin review to flip PENDING -> ACTIVE. Onboarding gate, not Flow 5 enforcement."""
        await self._repo.set_status(doctor_id, RegistrationStatus.ACTIVE)
        await self._doctor_repo.set_platform_status(doctor_id, PlatformRegistrationStatus.ACTIVE)

    async def get_status(self, doctor_id: str) -> RegistrationStatus | None:
        record = await self._repo.get_by_doctor_id(doctor_id)
        return record.status if record else None