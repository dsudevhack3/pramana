import pytest
from unittest.mock import AsyncMock

from src.modules.prescriptions.schemas.prescription_schema import PatientRiskWarning
from src.modules.prescriptions.services.patient_risk_check_service import PatientRiskCheckService


@pytest.mark.asyncio
async def test_no_warning_when_no_active_flags():
    flag_service = AsyncMock()
    flag_service.get_active_flags.return_value = []
    service = PatientRiskCheckService(flag_service)

    result = await service.check("patient-1")
    assert result == PatientRiskWarning(has_warning=False)


@pytest.mark.asyncio
async def test_warning_surfaced_from_latest_flag():
    flag_service = AsyncMock()
    fake_flag = AsyncMock(rule_reason="doctor_shopping detected", id="flag-uuid")
    flag_service.get_active_flags.return_value = [fake_flag]
    service = PatientRiskCheckService(flag_service)

    result = await service.check("patient-1")
    assert result.has_warning is True
    assert result.message == "doctor_shopping detected"