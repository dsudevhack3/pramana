"""
Doctor-shopping: same patient + same controlled-drug class + 2+ doctors
within N days. Purely a read/aggregate over prescription_line_item + the
doctor's identity on the parent prescription — no writes outside
flagged_candidate.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.settings import get_settings
from src.modules.prescriptions.models.prescription import Prescription
from src.modules.prescriptions.models.prescription_line_item import PrescriptionLineItem

settings = get_settings()


class DoctorShoppingCandidate:
    def __init__(self, patient_id: str, drug_class: str, doctor_ids: set[str], prescription_ids: list[str]):
        self.patient_id = patient_id
        self.drug_class = drug_class
        self.doctor_ids = doctor_ids
        self.prescription_ids = prescription_ids


async def run_doctor_shopping_check(session: AsyncSession) -> list[DoctorShoppingCandidate]:
    window_start = datetime.now(timezone.utc) - timedelta(days=settings.FLAG_DOCTOR_SHOPPING_WINDOW_DAYS)

    result = await session.execute(
        select(
            Prescription.patient_id, PrescriptionLineItem.drug_class,
            Prescription.doctor_id, Prescription.id,
        )
        .join(PrescriptionLineItem, PrescriptionLineItem.prescription_id == Prescription.id)
        .where(
            PrescriptionLineItem.is_controlled_substance.is_(True),
            Prescription.created_at >= window_start,
        )
    )
    rows = result.all()

    grouped: dict[tuple[str, str], DoctorShoppingCandidate] = {}
    for patient_id, drug_class, doctor_id, prescription_id in rows:
        if drug_class is None:
            continue
        key = (str(patient_id), drug_class)
        if key not in grouped:
            grouped[key] = DoctorShoppingCandidate(str(patient_id), drug_class, set(), [])
        grouped[key].doctor_ids.add(str(doctor_id))
        grouped[key].prescription_ids.append(str(prescription_id))

    return [
        c for c in grouped.values()
        if len(c.doctor_ids) >= settings.FLAG_DOCTOR_SHOPPING_MIN_DOCTORS
    ]