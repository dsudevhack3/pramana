"""Full Flow 5: flag -> review -> suspend -> signed ledger entry."""
import pytest
from unittest.mock import AsyncMock

from src.modules.admin.models.admin_action import ActionType
from src.modules.admin.repository import AdminActionRepository, AdminRepository
from src.modules.admin.services.admin_action_signer import AdminActionSigner
from src.modules.admin.services.admin_keygen_service import AdminKeygenService
from src.modules.admin.services.enforcement_service import EnforcementService
from src.modules.doctors.models.doctor import DoctorLicenseStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.doctors.services.revocation_watcher import RevocationWatcher
from src.modules.flagging.models.flagged_candidate import CandidateStatus, TargetType
from src.modules.flagging.repository import FlaggingRepository
from src.modules.patients.repository import PatientFlagRepository
from src.modules.patients.services.patient_flag_service import PatientFlagService
from src.modules.pharmacies.repository import PharmacistRepository


@pytest.mark.asyncio
async def test_flag_review_suspend_signed_ledger(db_session, sample_doctor):
    # Setup: admin account + signing key
    admin_repo = AdminRepository(db_session)
    admin = await admin_repo.create(email="admin@platform.com", password_hash="hashed", full_name="Platform Admin")
    keygen_service = AdminKeygenService(admin_repo)
    await keygen_service.generate_and_store(str(admin.id))

    # Setup: a flagged candidate targeting the doctor
    flagging_repo = FlaggingRepository(db_session)
    candidate = await flagging_repo.create(
        rule_name="signing_pace", target_type=TargetType.DOCTOR, target_id=str(sample_doctor.id),
        evidence={"scripts_in_window": 20},
    )

    # Enforcement: suspend the doctor
    signer = AdminActionSigner(keygen_service, admin_repo, db_session)
    revocation_watcher = RevocationWatcher(DoctorRepository(db_session), AsyncMock())
    service = EnforcementService(
        signer, revocation_watcher, PharmacistRepository(db_session),
        PatientFlagService(PatientFlagRepository(db_session)), flagging_repo,
    )
    action = await service.suspend_doctor(
        str(sample_doctor.id), str(admin.id), str(candidate.id), "Signing pace anomaly confirmed"
    )

    # Assertions: doctor blocked, action signed and hash-chained, candidate marked ACTIONED
    doctor_repo = DoctorRepository(db_session)
    doctor = await doctor_repo.get_by_id(str(sample_doctor.id))
    assert doctor.license_status == DoctorLicenseStatus.REVOKED

    assert action.record_hash is not None
    assert action.action_type == ActionType.SUSPEND_DOCTOR

    refreshed_candidate = await flagging_repo.get_by_id(str(candidate.id))
    assert refreshed_candidate.status == CandidateStatus.ACTIONED

    ledger_repo = AdminActionRepository(db_session)
    all_actions = await ledger_repo.list_all()
    assert len(all_actions) == 1