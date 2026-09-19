from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.patients.models.patient import Patient
from src.modules.patients.models.patient_flag import PatientFlag


class PatientRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_or_create(self, full_name: str, phone: str, dob: str) -> Patient:
        result = await self._session.execute(select(Patient).where(Patient.phone == phone))
        patient = result.scalar_one_or_none()
        if patient is None:
            patient = Patient(full_name=full_name, phone=phone, dob=dob)
            self._session.add(patient)
            await self._session.flush()
        return patient

    async def get_by_id(self, patient_id: str) -> Patient | None:
        result = await self._session.execute(select(Patient).where(Patient.id == patient_id))
        return result.scalar_one_or_none()


class PatientFlagRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self, patient_id: str, rule_reason: str, evidence_ref: str, evidence: dict, admin_id: str
    ) -> PatientFlag:
        flag = PatientFlag(
            patient_id=patient_id, rule_reason=rule_reason, evidence_ref=evidence_ref,
            evidence=evidence, created_by_admin_id=admin_id,
        )
        self._session.add(flag)
        await self._session.flush()
        return flag

    async def list_active_by_patient(self, patient_id: str) -> list[PatientFlag]:
        result = await self._session.execute(
            select(PatientFlag)
            .where(PatientFlag.patient_id == patient_id, PatientFlag.is_active.is_(True))
            .order_by(PatientFlag.created_at.desc())
        )
        return list(result.scalars().all())

    async def set_active(self, flag_id: str, is_active: bool) -> None:
        result = await self._session.execute(select(PatientFlag).where(PatientFlag.id == flag_id))
        flag = result.scalar_one()
        flag.is_active = is_active
        await self._session.flush()