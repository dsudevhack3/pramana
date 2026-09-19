"""One pharmacy dispensing >X% of a single doctor's total scripts — reads token_consumptions joined to prescriptions."""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.settings import get_settings
from src.modules.prescriptions.models.prescription import Prescription
from src.modules.verification.models.token_consumption import TokenConsumption

settings = get_settings()


class PharmacyConcentrationCandidate:
    def __init__(self, doctor_id: str, pharmacist_id: str, concentration_pct: float, total_scripts: int):
        self.doctor_id = doctor_id
        self.pharmacist_id = pharmacist_id
        self.concentration_pct = concentration_pct
        self.total_scripts = total_scripts


async def run_pharmacy_concentration_check(session: AsyncSession) -> list[PharmacyConcentrationCandidate]:
    totals_result = await session.execute(
        select(Prescription.doctor_id, func.count(Prescription.id)).group_by(Prescription.doctor_id)
    )
    totals = {str(doctor_id): count for doctor_id, count in totals_result.all()}

    per_pharmacist_result = await session.execute(
        select(
            Prescription.doctor_id, TokenConsumption.pharmacist_id, func.count(TokenConsumption.id)
        )
        .join(TokenConsumption, TokenConsumption.prescription_token == Prescription.token)
        .group_by(Prescription.doctor_id, TokenConsumption.pharmacist_id)
    )

    candidates = []
    for doctor_id, pharmacist_id, count in per_pharmacist_result.all():
        total = totals.get(str(doctor_id), 0)
        if total == 0:
            continue
        pct = count / total
        if pct > settings.FLAG_PHARMACY_CONCENTRATION_PCT_THRESHOLD:
            candidates.append(PharmacyConcentrationCandidate(str(doctor_id), str(pharmacist_id), pct, total))
    return candidates