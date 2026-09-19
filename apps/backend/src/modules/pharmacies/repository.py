from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.pharmacies.models.pharmacist import Pharmacist
from src.modules.pharmacies.models.pharmacy import Pharmacy, PharmacyStatus


class PharmacyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self, name: str, license_number: str, state_council_name: str,
        address_raw: str, place_id: str, lat: float, lng: float,
    ) -> Pharmacy:
        pharmacy = Pharmacy(
            name=name, license_number=license_number, state_council_name=state_council_name,
            address_raw=address_raw, maps_place_id=place_id, latitude=lat, longitude=lng,
        )
        self._session.add(pharmacy)
        await self._session.flush()
        return pharmacy

    async def get_by_id(self, pharmacy_id: str) -> Pharmacy | None:
        result = await self._session.execute(select(Pharmacy).where(Pharmacy.id == pharmacy_id))
        return result.scalar_one_or_none()

    async def list_pending(self) -> list[Pharmacy]:
        result = await self._session.execute(
            select(Pharmacy).where(Pharmacy.status == PharmacyStatus.PENDING)
        )
        return list(result.scalars().all())

    async def set_status(self, pharmacy_id: str, status: PharmacyStatus) -> None:
        pharmacy = await self.get_by_id(pharmacy_id)
        if pharmacy is None:
            raise ValueError(f"Pharmacy {pharmacy_id} not found")
        pharmacy.status = status
        await self._session.flush()


class PharmacistRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, email: str, password_hash: str, full_name: str, pharmacy_id: str) -> Pharmacist:
        pharmacist = Pharmacist(
            email=email, password_hash=password_hash, full_name=full_name, pharmacy_id=pharmacy_id
        )
        self._session.add(pharmacist)
        await self._session.flush()
        return pharmacist

    async def get_by_id(self, pharmacist_id: str) -> Pharmacist | None:
        result = await self._session.execute(
            select(Pharmacist).where(Pharmacist.id == pharmacist_id)
        )
        return result.scalar_one_or_none()

    async def set_suspended(self, pharmacist_id: str, is_suspended: bool) -> None:
        """Called only by admin/enforcement_service.py (Flow 5)."""
        pharmacist = await self.get_by_id(pharmacist_id)
        if pharmacist is None:
            raise ValueError(f"Pharmacist {pharmacist_id} not found")
        pharmacist.is_suspended = is_suspended
        await self._session.flush()

    async def list_by_pharmacy(self, pharmacy_id: str) -> list[Pharmacist]:
        result = await self._session.execute(
            select(Pharmacist).where(Pharmacist.pharmacy_id == pharmacy_id)
        )
        return list(result.scalars().all())