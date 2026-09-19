"""End-to-end: sign a prescription, then verify it through Flow 3's lookup + trust tier + integrity check."""
import base64
import pytest
from unittest.mock import AsyncMock

from cryptography.hazmat.primitives.serialization import load_pem_private_key

from src.core.security.crypto.hash_chain import verify_chain_integrity
from src.core.security.crypto.keygen import generate_keypair
from src.core.security.crypto.signer import canonicalize, sign_payload
from src.core.security.crypto.verifier import verify_signature
from src.modules.doctors.models.doctor import DoctorLicenseStatus, PlatformRegistrationStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.patients.repository import PatientRepository
from src.modules.prescriptions.repository import PrescriptionRepository
from src.modules.prescriptions.schemas.prescription_schema import DrugLineInput, PrescriptionCreateRequest
from src.modules.prescriptions.services.signing_orchestrator import SigningOrchestrator
from src.modules.verification.services.trust_tier_resolver import resolve_trust_tier


@pytest.mark.asyncio
async def test_end_to_end_sign_then_verify(db_session, sample_doctor):
    doctor_repo = DoctorRepository(db_session)
    keypair = generate_keypair()
    await doctor_repo.set_signing_public_key(str(sample_doctor.id), keypair.public_key_b64)
    await doctor_repo.update_license_status(
        str(sample_doctor.id), "LIC1", "Council", DoctorLicenseStatus.AUTO_APPROVED, source="test"
    )
    await doctor_repo.set_platform_status(str(sample_doctor.id), PlatformRegistrationStatus.ACTIVE)

    patient_repo = PatientRepository(db_session)
    patient = await patient_repo.get_or_create("E2E Patient", "+919000000001", "1988-08-08")

    payload = {"drug_lines": [{"drug_name": "Amoxicillin", "dosage": "250mg"}]}
    canonical = canonicalize(payload)
    private_key = load_pem_private_key(keypair.private_key_pem, password=None)
    signature = sign_payload(private_key, canonical)

    drug_validator = AsyncMock()
    drug_validator.validate_line.return_value = {"drug_class": None, "is_controlled_substance": False}
    orchestrator = SigningOrchestrator(PrescriptionRepository(db_session), doctor_repo, drug_validator, db_session)

    prescription = await orchestrator.sign_and_submit(PrescriptionCreateRequest(
        doctor_id=str(sample_doctor.id), patient_id=str(patient.id),
        drug_lines=[DrugLineInput(drug_name="Amoxicillin", dosage="250mg", quantity=15, frequency="TID", duration_days=5)],
        idempotency_key="idem-e2e-full", canonical_payload_b64=base64.b64encode(canonical).decode(),
        signature_b64=signature,
    ))

    # Flow 3 checks
    trust_tier = resolve_trust_tier(prescription)
    assert trust_tier.tier_label == "Fully Verified, Independent Practice"

    sig_valid = verify_signature(
        prescription.signer_public_key_ref, canonicalize(prescription.payload), prescription.signature
    )
    assert sig_valid is True

    broken_links = await verify_chain_integrity(db_session)
    assert prescription.record_hash not in broken_links