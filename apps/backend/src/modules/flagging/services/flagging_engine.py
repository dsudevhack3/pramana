"""
Orchestrator. Runs all four deterministic checks and writes FLAGGED
candidates ONLY — never suspends or bans anything itself. This is the
enforced separation of detection from enforcement that makes
"admin-exclusive" true in code, not just policy.
"""
from src.config.feature_flags import get_feature_flags
from src.modules.flagging.models.flagged_candidate import TargetType
from src.modules.flagging.repository import FlaggingRepository
from src.modules.flagging.services.doctor_shopping_check import run_doctor_shopping_check
from src.modules.flagging.services.geo_mismatch_check import run_geo_mismatch_check
from src.modules.flagging.services.pharmacy_concentration_check import run_pharmacy_concentration_check
from src.modules.flagging.services.signing_pace_check import run_signing_pace_check

flags = get_feature_flags()


class FlaggingEngine:
    def __init__(self, repo: FlaggingRepository, session) -> None:
        self._repo = repo
        self._session = session

    async def run_all_checks(self) -> int:
        created = 0

        if flags.FLAGGING_ENABLE_DOCTOR_SHOPPING_CHECK:
            for c in await run_doctor_shopping_check(self._session):
                await self._repo.create(
                    rule_name="doctor_shopping", target_type=TargetType.PATIENT, target_id=c.patient_id,
                    evidence={
                        "drug_class": c.drug_class, "doctor_ids": list(c.doctor_ids),
                        "prescription_ids": c.prescription_ids,
                    },
                )
                created += 1

        if flags.FLAGGING_ENABLE_PHARMACY_CONCENTRATION_CHECK:
            for c in await run_pharmacy_concentration_check(self._session):
                await self._repo.create(
                    rule_name="pharmacy_concentration", target_type=TargetType.PHARMACY,
                    target_id=c.pharmacist_id,
                    evidence={
                        "doctor_id": c.doctor_id, "concentration_pct": round(c.concentration_pct * 100, 1),
                        "total_scripts": c.total_scripts,
                    },
                )
                created += 1

        if flags.FLAGGING_ENABLE_SIGNING_PACE_CHECK:
            for c in await run_signing_pace_check(self._session):
                await self._repo.create(
                    rule_name="signing_pace", target_type=TargetType.DOCTOR, target_id=c.doctor_id,
                    evidence={
                        "scripts_in_window": c.scripts_in_window,
                        "prescription_ids": c.prescription_ids,
                        "window_start": str(c.window_start),
                    },
                )
                created += 1

        if flags.FLAGGING_ENABLE_GEO_MISMATCH_CHECK:
            for c in await run_geo_mismatch_check(self._session):
                await self._repo.create(
                    rule_name="geo_mismatch", target_type=TargetType.DOCTOR, target_id=c.doctor_id,
                    evidence={
                        "prescription_id": c.prescription_id,
                        "distance_meters": round(c.distance_meters, 1),
                    },
                )
                created += 1

        return created