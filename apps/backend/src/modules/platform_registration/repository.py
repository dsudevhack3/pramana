from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.platform_registration.models.platform_registration import (
    PlatformRegistration, RegistrationStatus,
)


class PlatformRegistrationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_doctor_id(self, doctor_id: str) -> PlatformRegistration | None:
        result = await self._session.execute(
            select(PlatformRegistration).where(PlatformRegistration.doctor_id == doctor_id)
        )
        return result.scalar_one_or_none()

    async def create_or_reset(self, doctor_id: str, status: RegistrationStatus) -> PlatformRegistration:
        record = await self.get_by_doctor_id(doctor_id)
        if record is None:
            record = PlatformRegistration(doctor_id=doctor_id, status=status)
            self._session.add(record)
        else:
            record.status = status
        await self._session.flush()
        return record

    async def set_status(self, doctor_id: str, status: RegistrationStatus) -> None:
        record = await self.get_by_doctor_id(doctor_id)
        if record is None:
            raise ValueError(f"No platform registration found for doctor {doctor_id}")
        record.status = status
        await self._session.flush()