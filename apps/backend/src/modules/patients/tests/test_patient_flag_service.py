import pytest

from src.modules.patients.repository import PatientFlagRepository, PatientRepository
from src.modules.patients.services.patient_flag_service import PatientFlagService


@pytest.mark.asyncio
async def test_flag_is_soft_and_has_no_ban_method(db_session):
    """PatientFlagService must not expose any suspend/ban method — enforced by asserting absence."""
    service = PatientFlagService(PatientFlagRepository(db_session))
    assert not hasattr(service, "suspend")
    assert not hasattr(service, "ban")


@pytest.mark.asyncio
async def test_create_and_retrieve_active_flag(db_session):
    patient_repo = PatientRepository(db_session)
    patient = await patient_repo.get_or_create("Test Patient", "+919999999999", "2000-01-01")

    service = PatientFlagService(PatientFlagRepository(db_session))
    await service.create_flag(
        str(patient.id), "doctor_shopping detected", "00000000-0000-0000-0000-000000000001",
        {"detail": "test"}, "admin-1",
    )
    flags = await service.get_active_flags(str(patient.id))
    assert len(flags) == 1
    assert flags[0].rule_reason == "doctor_shopping detected"