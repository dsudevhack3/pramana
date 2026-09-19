"""
The only writer of bans/suspensions in the entire codebase. Differentiates
hard-block (doctor/pharmacy) from soft-flag (patient) per Flow 5.
Requires ADMIN_ENFORCEMENT_WRITES_ENABLED feature flag — the emergency
kill switch.
"""
from src.config.feature_flags import get_feature_flags
from src.core.exceptions.domain_exceptions import EnforcementWritesDisabledError
from src.modules.admin.models.admin_action import ActionType
from src.modules.admin.services.admin_action_signer import AdminActionSigner
from src.modules.doctors.services.revocation_watcher import RevocationWatcher
from src.modules.flagging.models.flagged_candidate import CandidateStatus, TargetType
from src.modules.flagging.repository import FlaggingRepository
from src.modules.patients.services.patient_flag_service import PatientFlagService
from src.modules.pharmacies.repository import PharmacistRepository


class EnforcementService:
    def __init__(
        self, signer: AdminActionSigner, revocation_watcher: RevocationWatcher,
        pharmacist_repo: PharmacistRepository, patient_flag_service: PatientFlagService,
        flagging_repo: FlaggingRepository,
    ) -> None:
        self._signer = signer
        self._revocation_watcher = revocation_watcher
        self._pharmacist_repo = pharmacist_repo
        self._patient_flag_service = patient_flag_service
        self._flagging_repo = flagging_repo
        self._flags = get_feature_flags()

    def _assert_writes_enabled(self) -> None:
        if not self._flags.ADMIN_ENFORCEMENT_WRITES_ENABLED:
            raise EnforcementWritesDisabledError()

    async def suspend_doctor(self, doctor_id: str, admin_id: str, evidence_ref: str, reason_note: str | None):
        self._assert_writes_enabled()
        # Reuses the exact same block mechanism revocation_watcher already uses.
        await self._revocation_watcher.block_doctor(doctor_id, source="admin_enforcement")
        from src.modules.doctors.repository import DoctorRepository
        action = await self._signer.sign_and_record(
            admin_id, ActionType.SUSPEND_DOCTOR, TargetType.DOCTOR, doctor_id, evidence_ref, reason_note
        )
        await self._flagging_repo.set_status(evidence_ref, CandidateStatus.ACTIONED)
        return action

    async def suspend_pharmacy(
        self, pharmacy_id: str, pharmacist_ids: list[str], admin_id: str,
        evidence_ref: str, reason_note: str | None,
    ):
        self._assert_writes_enabled()
        for pid in pharmacist_ids:
            await self._pharmacist_repo.set_suspended(pid, is_suspended=True)
        action = await self._signer.sign_and_record(
            admin_id, ActionType.SUSPEND_PHARMACY, TargetType.PHARMACY, pharmacy_id, evidence_ref, reason_note
        )
        await self._flagging_repo.set_status(evidence_ref, CandidateStatus.ACTIONED)
        return action

    async def flag_patient(self, patient_id: str, admin_id: str, evidence_ref: str, rule_reason: str):
        """NOT a ban. Soft flag surfaced as a warning in Flow 2 — the doctor still decides."""
        self._assert_writes_enabled()
        candidate = await self._flagging_repo.get_by_id(evidence_ref)
        evidence = candidate.evidence if candidate else {}

        await self._patient_flag_service.create_flag(
            patient_id, rule_reason, evidence_ref, evidence, admin_id
        )
        action = await self._signer.sign_and_record(
            admin_id, ActionType.FLAG_PATIENT, TargetType.PATIENT, patient_id, evidence_ref, rule_reason
        )
        await self._flagging_repo.set_status(evidence_ref, CandidateStatus.ACTIONED)
        return action

    async def dismiss_candidate(self, candidate_id: str, admin_id: str):
        self._assert_writes_enabled()
        await self._flagging_repo.set_status(candidate_id, CandidateStatus.DISMISSED)