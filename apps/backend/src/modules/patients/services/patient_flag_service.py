"""
Soft flag only. This service has NO suspend/ban method — that is
intentional and enforced by omission, not by a runtime check, per the
workflow doc: "NOT a ban... you cannot lock a patient out of healthcare."
"""
from src.modules.patients.models.patient_flag import PatientFlag
from src.modules.patients.repository import PatientFlagRepository


class PatientFlagService:
    def __init__(self, repo: PatientFlagRepository) -> None:
        self._repo = repo

    async def get_active_flags(self, patient_id: str) -> list[PatientFlag]:
        return await self._repo.list_active_by_patient(patient_id)

    async def create_flag(
        self, patient_id: str, rule_reason: str, evidence_ref: str, evidence: dict, admin_id: str
    ) -> PatientFlag:
        """Called only by admin/services/enforcement_service.py."""
        return await self._repo.create(patient_id, rule_reason, evidence_ref, evidence, admin_id)

    async def dismiss_flag(self, flag_id: str) -> None:
        await self._repo.set_active(flag_id, is_active=False)