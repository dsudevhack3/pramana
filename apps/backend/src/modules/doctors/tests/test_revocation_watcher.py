import pytest
from unittest.mock import AsyncMock

from src.modules.doctors.models.doctor import DoctorLicenseStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.doctors.services.revocation_watcher import RevocationWatcher


@pytest.mark.asyncio
async def test_block_doctor_sets_revoked_status(db_session, sample_doctor):
    repo = DoctorRepository(db_session)
    watcher = RevocationWatcher(repo, AsyncMock())

    await watcher.block_doctor(str(sample_doctor.id), source="revocation_watcher")

    updated = await repo.get_by_id(str(sample_doctor.id))
    assert updated.license_status == DoctorLicenseStatus.REVOKED


@pytest.mark.asyncio
async def test_run_for_all_active_doctors_blocks_on_revoked_status(db_session, sample_doctor):
    repo = DoctorRepository(db_session)
    registry_client = AsyncMock()
    registry_client.check_status.return_value = "revoked"
    watcher = RevocationWatcher(repo, registry_client)

    await watcher.run_for_all_active_doctors()

    updated = await repo.get_by_id(str(sample_doctor.id))
    assert updated.license_status == DoctorLicenseStatus.REVOKED