import pytest

from src.modules.patients.repository import PatientRepository
from src.modules.patients.services.patient_identity_service import PatientIdentityService
from src.modules.patients.schemas.patient_schema import PatientIdentityBindRequest


@pytest.mark.asyncio
async def test_bind_identity_creates_patient(db_session):
    service = PatientIdentityService(PatientRepository(db_session))
    patient_id = await service.bind_identity(
        PatientIdentityBindRequest(full_name="Jane Doe", phone="+919876543210", dob="1995-05-05")
    )
    assert patient_id is not None


@pytest.mark.asyncio
async def test_verify_otp_fails_with_wrong_code(db_session):
    service = PatientIdentityService(PatientRepository(db_session))
    patient_id = await service.bind_identity(
        PatientIdentityBindRequest(full_name="Jane Doe", phone="+919876543211", dob="1995-05-05")
    )
    result = await service.verify_otp(patient_id, "000000")
    assert result is False