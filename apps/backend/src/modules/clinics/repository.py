from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.clinics.models.clinic import Clinic


class ClinicRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_doctor_id(self, doctor_id: str) -> Clinic | None:
        result = await self._session.execute(select(Clinic).where(Clinic.doctor_id == doctor_id))
        return result.scalar_one_or_none()

    async def upsert_address(
        self, doctor_id: str, address_raw: str, place_id: str, lat: float, lng: float
    ) -> Clinic:
        clinic = await self.get_by_doctor_id(doctor_id)
        if clinic is None:
            clinic = Clinic(
                doctor_id=doctor_id, address_raw=address_raw, maps_place_id=place_id,
                latitude=lat, longitude=lng, geotagged_photo_url="", photo_lat=0, photo_lng=0,
            )
            self._session.add(clinic)
        else:
            clinic.address_raw = address_raw
            clinic.maps_place_id = place_id
            clinic.latitude = lat
            clinic.longitude = lng
        await self._session.flush()
        return clinic

    async def attach_photo(
        self, doctor_id: str, photo_url: str, photo_lat: float, photo_lng: float
    ) -> Clinic:
        clinic = await self.get_by_doctor_id(doctor_id)
        if clinic is None:
            raise ValueError("Clinic address must be submitted before photo")
        clinic.geotagged_photo_url = photo_url
        clinic.photo_lat = photo_lat
        clinic.photo_lng = photo_lng
        await self._session.flush()
        return clinic

    async def attach_registration_doc(
        self, doctor_id: str, reg_number: str, cross_checked: bool
    ) -> Clinic:
        clinic = await self.get_by_doctor_id(doctor_id)
        if clinic is None:
            raise ValueError("Clinic must exist before attaching registration doc")
        clinic.clinical_establishment_reg_number = reg_number
        clinic.reg_number_cross_checked = cross_checked
        await self._session.flush()
        return clinic

    async def mark_verified(self, doctor_id: str) -> None:
        clinic = await self.get_by_doctor_id(doctor_id)
        if clinic is None:
            raise ValueError("Clinic not found")
        clinic.is_verified = True
        await self._session.flush()