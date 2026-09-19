"""
An amendment is a brand-new signed Prescription row pointing back to the
original via previous_version_id, plus a PrescriptionAmendment audit
record explaining why. The original row's status flips to AMENDED — it
is never deleted or mutated in place.
"""
from src.core.exceptions.domain_exceptions import PrescriptionVoidedError
from src.modules.prescriptions.models.prescription import PrescriptionStatus
from src.modules.prescriptions.models.prescription_amendment import PrescriptionAmendment
from src.modules.prescriptions.repository import AmendmentRepository, PrescriptionRepository
from src.modules.prescriptions.schemas.prescription_schema import PrescriptionAmendRequest, PrescriptionCreateRequest
from src.modules.prescriptions.services.signing_orchestrator import SigningOrchestrator


class AmendmentService:
    def __init__(
        self, repo: PrescriptionRepository, amendment_repo: AmendmentRepository,
        orchestrator: SigningOrchestrator,
    ) -> None:
        self._repo = repo
        self._amendment_repo = amendment_repo
        self._orchestrator = orchestrator

    async def amend(self, body: PrescriptionAmendRequest):
        original = await self._repo.get_by_id(body.original_prescription_id)
        if original is None:
            raise ValueError("Original prescription not found")
        if original.status == PrescriptionStatus.VOIDED:
            raise PrescriptionVoidedError()

        new_prescription = await self._orchestrator.sign_and_submit(
            PrescriptionCreateRequest(
                doctor_id=body.doctor_id,
                patient_id=str(original.patient_id),
                drug_lines=body.drug_lines,
                idempotency_key=body.idempotency_key,
                canonical_payload_b64=body.canonical_payload_b64,
                signature_b64=body.signature_b64,
            )
        )
        new_prescription.previous_version_id = original.id

        await self._repo.set_status(original.id, PrescriptionStatus.AMENDED)
        self._amendment_repo.add(PrescriptionAmendment(
            original_prescription_id=original.id,
            new_prescription_id=new_prescription.id,
            reason=body.reason,
        ))
        await self._repo.flush()
        return new_prescription