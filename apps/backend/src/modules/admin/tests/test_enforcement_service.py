import pytest
from unittest.mock import AsyncMock

from src.config.feature_flags import get_feature_flags
from src.core.exceptions.domain_exceptions import EnforcementWritesDisabledError
from src.modules.admin.models.admin_action import ActionType
from src.modules.admin.services.enforcement_service import EnforcementService
from src.modules.flagging.models.flagged_candidate import TargetType


@pytest.mark.asyncio
async def test_suspend_doctor_signs_and_records():
    signer = AsyncMock()
    signer.sign_and_record.return_value = AsyncMock(
        action_type=ActionType.SUSPEND_DOCTOR, target_type=TargetType.DOCTOR
    )
    revocation_watcher = AsyncMock()
    flagging_repo = AsyncMock()

    service = EnforcementService(signer, revocation_watcher, AsyncMock(), AsyncMock(), flagging_repo)
    await service.suspend_doctor("doc-1", "admin-1", "evidence-1", "reason")

    revocation_watcher.block_doctor.assert_awaited_once_with("doc-1", source="admin_enforcement")
    signer.sign_and_record.assert_awaited_once()
    flagging_repo.set_status.assert_awaited_once()


@pytest.mark.asyncio
async def test_enforcement_kill_switch_blocks_writes(monkeypatch):
    flags = get_feature_flags()
    monkeypatch.setattr(flags, "ADMIN_ENFORCEMENT_WRITES_ENABLED", False)

    service = EnforcementService(AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock())
    with pytest.raises(EnforcementWritesDisabledError):
        await service.suspend_doctor("doc-1", "admin-1", "evidence-1", None)


@pytest.mark.asyncio
async def test_flag_patient_is_not_a_ban():
    """flag_patient must never call any suspend/ban repository method."""
    signer = AsyncMock()
    signer.sign_and_record.return_value = AsyncMock(action_type=ActionType.FLAG_PATIENT)
    patient_flag_service = AsyncMock()
    flagging_repo = AsyncMock()
    flagging_repo.get_by_id.return_value = AsyncMock(evidence={})

    service = EnforcementService(signer, AsyncMock(), AsyncMock(), patient_flag_service, flagging_repo)
    await service.flag_patient("patient-1", "admin-1", "evidence-1", "reason")

    patient_flag_service.create_flag.assert_awaited_once()
    assert not hasattr(patient_flag_service, "suspend")