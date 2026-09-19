"""
NEW in v2. Reads patients/services/patient_flag_service.py at the
patient-lookup step of Flow 2. Purely advisory: surfaces a warning banner
to the doctor (PatientRiskWarningBanner.tsx), never blocks prescription
creation. The doctor always makes the final call — this mirrors the
real-world PDMP design referenced in Flow 5.
"""
from src.modules.patients.services.patient_flag_service import PatientFlagService
from src.modules.prescriptions.schemas.prescription_schema import PatientRiskWarning


class PatientRiskCheckService:
    def __init__(self, flag_service: PatientFlagService) -> None:
        self._flag_service = flag_service

    async def check(self, patient_id: str) -> PatientRiskWarning:
        flags = await self._flag_service.get_active_flags(patient_id)
        if not flags:
            return PatientRiskWarning(has_warning=False)

        # Show the most recent/severe flag; doctor can view full history
        # via a separate endpoint if they want more context.
        latest = flags[0]
        return PatientRiskWarning(
            has_warning=True,
            message=latest.rule_reason,
            evidence_ref=str(latest.id),
        )