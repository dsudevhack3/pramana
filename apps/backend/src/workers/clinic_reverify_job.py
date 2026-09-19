"""
clinic_reverify_job (Flow 4): random spot-audits on clinic addresses,
weighted by prescription volume. Flags suspicious clinics for manual
review — writes to a lightweight review queue, distinct from
flagged_candidate (that's reserved for the four deterministic fraud
checks in flagging/).
"""
import random

from sqlalchemy import func, select

from src.core.db.session import db_session_context
from src.modules.clinics.models.clinic import Clinic
from src.modules.clinics.services.maps_verification_service import MapsVerificationService
from src.modules.prescriptions.models.prescription import Prescription

SPOT_AUDIT_SAMPLE_SIZE = 20


async def run_clinic_reverify_job() -> None:
    async with db_session_context() as session:
        result = await session.execute(
            select(Clinic, func.count(Prescription.id))
            .join(Prescription, Prescription.doctor_id == Clinic.doctor_id)
            .group_by(Clinic.id)
            .order_by(func.count(Prescription.id).desc())
        )
        weighted_clinics = result.all()
        if not weighted_clinics:
            return

        weights = [count for _, count in weighted_clinics]
        sample_size = min(SPOT_AUDIT_SAMPLE_SIZE, len(weighted_clinics))
        sampled = random.choices(weighted_clinics, weights=weights, k=sample_size)

        maps = MapsVerificationService()
        for clinic, _ in sampled:
            result = await maps.confirm_address(clinic.address_raw)
            if result is None or result.place_id != clinic.maps_place_id:
                clinic.is_verified = False  # flags for manual review; UI surfaces is_verified == False
        await session.flush()