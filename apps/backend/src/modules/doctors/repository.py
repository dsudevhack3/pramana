from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.doctors.models.doctor import Doctor, DoctorLicenseStatus, PlatformRegistrationStatus
from src.modules.doctors.models.license_status_history import LicenseStatusHistory


class DoctorRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, email: str, password_hash: str, full_name: str) -> Doctor:
        doctor = Doctor(email=email, password_hash=password_hash, full_name=full_name)
        self._session.add(doctor)
        await self._session.flush()
        return doctor

    async def get_by_id(self, doctor_id: str) -> Doctor | None:
        result = await self._session.execute(select(Doctor).where(Doctor.id == doctor_id))
        return result.scalar_one_or_none()

    async def list_active_doctors(self) -> list[Doctor]:
        result = await self._session.execute(
            select(Doctor).where(Doctor.license_status != DoctorLicenseStatus.REVOKED)
        )
        return list(result.scalars().all())

    async def update_license_status(
        self, doctor_id: str, license_number: str | None, council_name: str | None,
        new_status: DoctorLicenseStatus, source: str,
    ) -> None:
        doctor = await self.get_by_id(doctor_id)
        if doctor is None:
            raise ValueError(f"Doctor {doctor_id} not found")

        previous = doctor.license_status
        if license_number:
            doctor.license_number = license_number
        if council_name:
            doctor.council_name = council_name
        doctor.license_status = new_status

        self._session.add(LicenseStatusHistory(
            doctor_id=doctor_id, previous_status=previous.value,
            new_status=new_status.value, source=source,
        ))
        await self._session.flush()

    async def set_signing_public_key(self, doctor_id: str, public_key_b64: str) -> None:
        doctor = await self.get_by_id(doctor_id)
        if doctor is None:
            raise ValueError(f"Doctor {doctor_id} not found")
        doctor.signing_public_key = public_key_b64
        await self._session.flush()

    async def set_platform_status(self, doctor_id: str, status: PlatformRegistrationStatus) -> None:
        doctor = await self.get_by_id(doctor_id)
        if doctor is None:
            raise ValueError(f"Doctor {doctor_id} not found")
        doctor.platform_status = status
        await self._session.flush()

    async def set_suspended(self, doctor_id: str, is_suspended: bool) -> None:
        """Called only by admin/enforcement_service.py (Flow 5)."""
        doctor = await self.get_by_id(doctor_id)
        if doctor is None:
            raise ValueError(f"Doctor {doctor_id} not found")
        doctor.is_suspended = is_suspended
        await self._session.flush()

    async def set_organization(self, doctor_id: str, organization_id: str | None) -> None:
        doctor = await self.get_by_id(doctor_id)
        if doctor is None:
            raise ValueError(f"Doctor {doctor_id} not found")
        doctor.organization_id = organization_id
        await self._session.flush()