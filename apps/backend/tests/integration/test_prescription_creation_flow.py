"""Full Flow 2 happy path: bind patient -> sign prescription -> verify chain link."""
import base64
import pytest
from unittest.mock import AsyncMock

from cryptography.hazmat.primitives.serialization import load_pem_private_key

from src.core.security.crypto.keygen import generate_keypair
from src.core.security.crypto.signer import canonicalize, sign_payload
from src.modules.doctors.models.doctor import DoctorLicenseStatus, PlatformRegistrationStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.patients.repository import PatientRepository
from src.modules.prescriptions.repository import PrescriptionRepository
from src.modules.prescriptions.schemas.prescription_schema import DrugLineInput, PrescriptionCreateRequest
from src.modules.prescriptions.services.signing_orchestrator import SigningOrchestrator


@pytest.mark.asyncio
async def test_full_prescription_creation_flow(db_session, sample_doctor):
    doctor_repo = DoctorRepository(db_session)
    keypair = generate_keypair()
    await doctor_repo.set_signing_public_key(str(sample_doctor.id), keypair.public_key_b64)
    await doctor_repo.update_license_status(
        str(sample_doctor.id), "LIC1", "Council", DoctorLicenseStatus.AUTO_APPROVED, source="test"
    )
    await doctor_repo.set_platform_status(str(sample_doctor.id), PlatformRegistrationStatus.ACTIVE)

    patient_repo = PatientRepository(db_session)
    patient = await patient_repo.get_or_create("Jane Doe", "+919876500000", "1992-02-02")

    payload = {"drug_lines": [{"drug_name": "Paracetamol", "dosage": "500mg"}]}
    canonical = canonicalize(payload)
    private_key = load_pem_private_key(keypair.private_key_pem, password=None)
    signature = sign_payload(private_key, canonical)

    drug_validator = AsyncMock()
    drug_validator.validate_line.return_value = {"drug_class": None, "is_controlled_substance": False}

    orchestrator = SigningOrchestrator(
        PrescriptionRepository(db_session), doctor_repo, drug_validator, db_session
    )
    prescription = await orchestrator.sign_and_submit(PrescriptionCreateRequest(
        doctor_id=str(sample_doctor.id), patient_id=str(patient.id),
        drug_lines=[DrugLineInput(drug_name="Paracetamol", dosage="500mg", quantity=10, frequency="BID", duration_days=5)],
        idempotency_key="idem-e2e-1",
        canonical_payload_b64=base64.b64encode(canonical).decode(),
        signature_b64=signature,
    ))

    assert prescription.record_hash is not None
    assert prescription.doctor_license_status_at_signing == "auto_approved"
    # Genesis record — no prior chain entries in this isolated test DB.
    assert prescription.previous_record_hash is None