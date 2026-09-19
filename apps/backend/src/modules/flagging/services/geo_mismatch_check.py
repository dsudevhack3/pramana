"""Signing location inconsistent with doctor's registered clinic address."""
import math

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.settings import get_settings
from src.modules.clinics.models.clinic import Clinic
from src.modules.prescriptions.models.prescription import Prescription

settings = get_settings()


class GeoMismatchCandidate:
    def __init__(self, doctor_id: str, prescription_id: str, distance_meters: float):
        self.doctor_id = doctor_id
        self.prescription_id = prescription_id
        self.distance_meters = distance_meters


def _haversine_m(lat1, lng1, lat2, lng2) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi, dlambda = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


async def run_geo_mismatch_check(session: AsyncSession) -> list[GeoMismatchCandidate]:
    """
    NOTE: assumes signing-location metadata (lat/lng captured client-side
    at Sign & Submit time) is present in Prescription.payload["signing_location"].
    Prescriptions signed before that client field existed are skipped.
    """
    result = await session.execute(
        select(Prescription.id, Prescription.doctor_id, Prescription.payload)
    )
    candidates = []
    clinic_cache: dict[str, Clinic | None] = {}

    for prescription_id, doctor_id, payload in result.all():
        signing_loc = payload.get("signing_location")
        if not signing_loc:
            continue

        doctor_key = str(doctor_id)
        if doctor_key not in clinic_cache:
            clinic_result = await session.execute(select(Clinic).where(Clinic.doctor_id == doctor_id))
            clinic_cache[doctor_key] = clinic_result.scalar_one_or_none()
        clinic = clinic_cache[doctor_key]
        if clinic is None:
            continue

        distance = _haversine_m(signing_loc["lat"], signing_loc["lng"], clinic.latitude, clinic.longitude)
        if distance > settings.FLAG_GEO_MISMATCH_RADIUS_METERS:
            candidates.append(GeoMismatchCandidate(doctor_key, str(prescription_id), distance))
    return candidates