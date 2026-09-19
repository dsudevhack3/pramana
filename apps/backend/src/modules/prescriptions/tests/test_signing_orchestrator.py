import base64
import pytest
from unittest.mock import AsyncMock

from src.core.exceptions.domain_exceptions import (
    DoctorLicenseRevokedError, DoctorNotVerifiedError, DoctorSuspendedError, InvalidSignatureError,
)
from src.core.security.crypto.keygen import generate_keypair
from src.core.security.crypto.signer import canonicalize, sign_payload
from src.core.security.crypto.signer import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from src.modules.doctors.models.doctor import DoctorLicenseStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.prescriptions.repository import PrescriptionRepository
from src.modules.prescriptions.schemas.prescription_schema import DrugLineInput, PrescriptionCreateRequest
from src.modules.prescriptions.services.signing_orchestrator import SigningOrchestrator


def _sign_test_payload(private_pem: bytes, payload: dict) -> tuple[bytes, str]:
    private_key = load_pem_private_key(private_pem, password=None)
    canonical = canonicalize(payload)
    signature = sign_payload(private_key, canonical)
    return canonical, signature


@pytest.mark.asyncio
async def test_sign_and_submit_rejects_unverified_doctor(db_session, sample_doctor):
    orchestrator = SigningOrchestrator(
        PrescriptionRepository(db_session), DoctorRepository(db_session), AsyncMock(), db_session
    )
    body = PrescriptionCreateRequest(
        doctor_id=str(sample_doctor.id), patient_id="00000000-0000-0000-0000-000000000000",
        drug_lines=[DrugLineInput(drug_name="X", dosage="1mg", quantity=1, frequency="OD", duration_days=1)],
        idempotency_key="idem-1", canonical_payload_b64=base64.b64encode(b"{}").decode(),
        signature_b64="fakesig",
    )
    with pytest.raises(DoctorNotVerifiedError):
        await orchestrator.sign_and_submit(body)


@pytest.mark.asyncio
async def test_sign_and_submit_rejects_revoked_doctor(db_session, sample_doctor):
    doctor_repo = DoctorRepository(db_session)
    keypair = generate_keypair()
    await doctor_repo.set_signing_public_key(str(sample_doctor.id), keypair.public_key_b64)
    await doctor_repo.update_license_status(
        str(sample_doctor.id), "LIC1", "Council", DoctorLicenseStatus.REVOKED, source="test"
    )

    orchestrator = SigningOrchestrator(
        PrescriptionRepository(db_session), doctor_repo, AsyncMock(), db_session
    )
    body = PrescriptionCreateRequest(
        doctor_id=str(sample_doctor.id), patient_id="00000000-0000-0000-0000-000000000000",
        drug_lines=[DrugLineInput(drug_name="X", dosage="1mg", quantity=1, frequency="OD", duration_days=1)],
        idempotency_key="idem-2", canonical_payload_b64=base64.b64encode(b"{}").decode(),
        signature_b64="fakesig",
    )
    with pytest.raises(DoctorLicenseRevokedError):
        await orchestrator.sign_and_submit(body)


@pytest.mark.asyncio
async def test_sign_and_submit_rejects_invalid_signature(db_session, sample_doctor):
    doctor_repo = DoctorRepository(db_session)
    keypair = generate_keypair()
    await doctor_repo.set_signing_public_key(str(sample_doctor.id), keypair.public_key_b64)
    await doctor_repo.update_license_status(
        str(sample_doctor.id), "LIC1", "Council", DoctorLicenseStatus.AUTO_APPROVED, source="test"
    )

    orchestrator = SigningOrchestrator(
        PrescriptionRepository(db_session), doctor_repo, AsyncMock(), db_session
    )
    body = PrescriptionCreateRequest(
        doctor_id=str(sample_doctor.id), patient_id="00000000-0000-0000-0000-000000000000",
        drug_lines=[DrugLineInput(drug_name="X", dosage="1mg", quantity=1, frequency="OD", duration_days=1)],
        idempotency_key="idem-3", canonical_payload_b64=base64.b64encode(b'{"tampered":true}').decode(),
        signature_b64="not-a-real-signature==",
    )
    with pytest.raises(InvalidSignatureError):
        await orchestrator.sign_and_submit(body)