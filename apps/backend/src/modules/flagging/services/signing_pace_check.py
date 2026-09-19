"""Prescriptions signed faster than physically plausible per patient (e.g. many scripts within one hour)."""
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.settings import get_settings
from src.modules.prescriptions.models.prescription import Prescription

settings = get_settings()


class SigningPaceCandidate:
    def __init__(self, doctor_id: str, window_start, scripts_in_window: int, prescription_ids: list[str]):
        self.doctor_id = doctor_id
        self.window_start = window_start
        self.scripts_in_window = scripts_in_window
        self.prescription_ids = prescription_ids


async def run_signing_pace_check(session: AsyncSession) -> list[SigningPaceCandidate]:
    result = await session.execute(
        select(Prescription.doctor_id, Prescription.id, Prescription.created_at)
        .order_by(Prescription.doctor_id, Prescription.created_at)
    )
    rows = result.all()

    by_doctor: dict[str, list[tuple[str, object]]] = {}
    for doctor_id, prescription_id, created_at in rows:
        by_doctor.setdefault(str(doctor_id), []).append((str(prescription_id), created_at))

    candidates = []
    for doctor_id, entries in by_doctor.items():
        window = []
        for prescription_id, created_at in entries:
            window.append((prescription_id, created_at))
            window = [e for e in window if created_at - e[1] <= timedelta(hours=1)]
            if len(window) > settings.FLAG_SIGNING_PACE_MAX_SCRIPTS_PER_HOUR:
                candidates.append(SigningPaceCandidate(
                    doctor_id, window[0][1], len(window), [e[0] for e in window]
                ))
                break
    return candidates