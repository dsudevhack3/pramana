from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.prescriptions.models.prescription import Prescription, PrescriptionStatus


class PrescriptionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def insert(self, prescription: Prescription) -> Prescription:
        self._session.add(prescription)
        await self._session.flush()
        return prescription

    async def get_by_id(self, prescription_id: str) -> Prescription | None:
        result = await self._session.execute(select(Prescription).where(Prescription.id == prescription_id))
        return result.scalar_one_or_none()

    async def get_by_token(self, token: str) -> Prescription | None:
        result = await self._session.execute(select(Prescription).where(Prescription.token == token))
        return result.scalar_one_or_none()

    async def get_by_idempotency_key(self, key: str) -> Prescription | None:
        result = await self._session.execute(
            select(Prescription).where(Prescription.idempotency_key == key)
        )
        return result.scalar_one_or_none()

    async def get_latest_version_in_chain(self, prescription_id: str) -> Prescription:
        """Walks previous_version_id forward to find the newest non-voided version, for Flow 3 lineage display."""
        current = await self.get_by_id(prescription_id)
        if current is None:
            raise ValueError("Prescription not found")

        result = await self._session.execute(
            select(Prescription).where(Prescription.previous_version_id == current.id)
        )
        newer = result.scalar_one_or_none()
        if newer is not None:
            return await self.get_latest_version_in_chain(str(newer.id))
        return current

    async def set_status(self, prescription_id: str, status: PrescriptionStatus) -> None:
        prescription = await self.get_by_id(prescription_id)
        if prescription is None:
            raise ValueError(f"Prescription {prescription_id} not found")
        prescription.status = status
        await self._session.flush()

    async def flush(self) -> None:
        await self._session.flush()


class AmendmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def add(self, amendment) -> None:
        self._session.add(amendment)