"""
The core of Flow 2. Orchestrates:
  1. Signature verification against the doctor's stored public key
  2. Stamping the doctor's CURRENT license/platform status permanently
     onto the record (the frozen point-in-time trust principle)
  3. Hash-chain append (shared with admin_action via core/security/crypto)
  4. Insert-only DB write

This is one of exactly two writers to the shared hash chain — the other
is admin/services/admin_action_signer.py. Both MUST use the same
append_to_chain() call under the same locking discipline to avoid a
split-chain race; see the FOR UPDATE note in hash_chain.py.
"""
import secrets
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions.domain_exceptions import (
    DoctorLicenseRevokedError, DoctorNotVerifiedError, DoctorSuspendedError,
    DuplicateIdempotencyKeyError, InvalidSignatureError,
)
from src.core.security.crypto.hash_chain import append_to_chain
from src.core.security.crypto.signer import canonicalize
from src.core.security.crypto.verifier import verify_signature
from src.modules.doctors.models.doctor import Doctor, DoctorLicenseStatus, PlatformRegistrationStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.prescriptions.models.prescription import Prescription
from src.modules.prescriptions.models.prescription_line_item import PrescriptionLineItem
from src.modules.prescriptions.repository import PrescriptionRepository
from src.modules.prescriptions.schemas.prescription_schema import PrescriptionCreateRequest
from src.modules.prescriptions.services.drug_validation_service import DrugValidationService


class SigningOrchestrator:
    def __init__(
        self, repo: PrescriptionRepository, doctor_repo: DoctorRepository,
        drug_validator: DrugValidationService, session: AsyncSession,
    ) -> None:
        self._repo = repo
        self._doctor_repo = doctor_repo
        self._drug_validator = drug_validator
        self._session = session

    async def sign_and_submit(self, body: PrescriptionCreateRequest) -> Prescription:
        doctor = await self._doctor_repo.get_by_id(body.doctor_id)
        if doctor is None or doctor.signing_public_key is None:
            raise DoctorNotVerifiedError()

        # Both block mechanisms checked here — govt revocation AND admin
        # Flow-5 suspension gate the same signing path, per revocation_watcher.py.
        if doctor.license_status == DoctorLicenseStatus.REVOKED:
            raise DoctorLicenseRevokedError()
        if doctor.is_suspended:
            raise DoctorSuspendedError()

        existing = await self._repo.get_by_idempotency_key(body.idempotency_key)
        if existing is not None:
            raise DuplicateIdempotencyKeyError()

        import base64
        canonical_payload = base64.b64decode(body.canonical_payload_b64)
        if not verify_signature(doctor.signing_public_key, canonical_payload, body.signature_b64):
            raise InvalidSignatureError()

        enriched_lines = []
        for line in body.drug_lines:
            meta = await self._drug_validator.validate_line(line)
            enriched_lines.append({**line.model_dump(), **meta})

        # Hash chain append — locking discipline (SELECT ... FOR UPDATE on
        # a chain-tip marker row) is applied at the transaction boundary
        # in the calling route/service layer, not shown here for brevity.
        new_hash, previous_hash = await append_to_chain(self._session, canonical_payload)

        token = secrets.token_urlsafe(24)
        prescription = Prescription(
            id=uuid.uuid4(),
            doctor_id=body.doctor_id,
            patient_id=body.patient_id,
            payload={"drug_lines": enriched_lines},
            idempotency_key=body.idempotency_key,
            doctor_license_status_at_signing=doctor.license_status.value,
            doctor_platform_status_at_signing=doctor.platform_status.value,
            doctor_org_id_at_signing=str(doctor.organization_id) if doctor.organization_id else None,
            record_hash=new_hash,
            previous_record_hash=previous_hash,
            signature=body.signature_b64,
            signer_public_key_ref=doctor.signing_public_key,
            token=token,
        )
        await self._repo.insert(prescription)

        for line_meta, line_input in zip(enriched_lines, body.drug_lines, strict=True):
            self._session.add(PrescriptionLineItem(
                prescription_id=prescription.id,
                drug_name=line_input.drug_name,
                drug_class=line_meta.get("drug_class"),
                is_controlled_substance=line_meta.get("is_controlled_substance", False),
                dosage=line_input.dosage,
                quantity=line_input.quantity,
                frequency=line_input.frequency,
                duration_days=line_input.duration_days,
            ))
        await self._session.flush()
        return prescription