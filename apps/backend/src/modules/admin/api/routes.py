from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.core.security.jwt import TokenPayload
from src.core.security.rbac import require_admin
from src.modules.admin.repository import AdminActionRepository, AdminRepository
from src.modules.admin.schemas.admin_action_schema import (
    AdminActionResponse, DismissCandidateRequest, FlagPatientRequest,
    SuspendDoctorRequest, SuspendPharmacyRequest,
)
from src.modules.admin.services.admin_action_signer import AdminActionSigner
from src.modules.admin.services.admin_keygen_service import AdminKeygenService
from src.modules.admin.services.enforcement_service import EnforcementService
from src.modules.doctors.repository import DoctorRepository
from src.modules.doctors.services.medical_registry_client import MedicalRegistryClient
from src.modules.doctors.services.revocation_watcher import RevocationWatcher
from src.modules.flagging.repository import FlaggingRepository
from src.modules.flagging.schemas.flagged_candidate_schema import FlaggedCandidateResponse
from src.modules.patients.repository import PatientFlagRepository
from src.modules.patients.services.patient_flag_service import PatientFlagService
from src.modules.pharmacies.repository import PharmacistRepository

router = APIRouter(dependencies=[Depends(require_admin)])  # every route here is admin-only


def get_enforcement_service(session: AsyncSession = Depends(get_db_session)) -> EnforcementService:
    admin_repo = AdminRepository(session)
    signer = AdminActionSigner(AdminKeygenService(admin_repo), admin_repo, session)
    revocation_watcher = RevocationWatcher(DoctorRepository(session), MedicalRegistryClient())
    return EnforcementService(
        signer, revocation_watcher, PharmacistRepository(session),
        PatientFlagService(PatientFlagRepository(session)), FlaggingRepository(session),
    )


@router.get("/me")
async def get_my_admin_profile(current_user: TokenPayload = Depends(require_admin)):
    return {
        "id": current_user.sub,
        "role": current_user.role,
    }


@router.get("/dashboard")
async def get_dashboard(session: AsyncSession = Depends(get_db_session)):
    flagging_repo = FlaggingRepository(session)
    action_repo = AdminActionRepository(session)

    flagged = await flagging_repo.list_open()
    actions = await action_repo.list_all()

    return {
        "open_flagged_count": len(flagged),
        "total_actions_count": len(actions),
    }


@router.get("/flagged-queue", response_model=list[FlaggedCandidateResponse])
async def get_flagged_queue(session: AsyncSession = Depends(get_db_session)):
    repo = FlaggingRepository(session)
    candidates = await repo.list_open()
    return [
        FlaggedCandidateResponse(
            id=str(c.id), rule_name=c.rule_name, target_type=c.target_type.value,
            target_id=str(c.target_id), evidence=c.evidence, status=c.status.value,
            created_at=c.created_at.isoformat(),
        )
        for c in candidates
    ]


@router.post("/doctors/{doctor_id}/suspend", response_model=AdminActionResponse)
async def suspend_doctor(
    doctor_id: str, body: SuspendDoctorRequest,
    service: EnforcementService = Depends(get_enforcement_service),
):
    try:
        action = await service.suspend_doctor(doctor_id, body.admin_id, body.evidence_ref, body.reason_note)
    except Exception as exc:
        raise HTTPException(400, str(exc)) from exc
    return AdminActionResponse(
        id=str(action.id), action_type=action.action_type.value, target_type=action.target_type.value,
        target_id=str(action.target_id), record_hash=action.record_hash, evidence_ref=str(action.evidence_ref),
    )


@router.post("/pharmacies/{pharmacy_id}/suspend", response_model=AdminActionResponse)
async def suspend_pharmacy(
    pharmacy_id: str, body: SuspendPharmacyRequest,
    service: EnforcementService = Depends(get_enforcement_service),
):
    try:
        action = await service.suspend_pharmacy(
            pharmacy_id, body.pharmacist_ids, body.admin_id, body.evidence_ref, body.reason_note
        )
    except Exception as exc:
        raise HTTPException(400, str(exc)) from exc
    return AdminActionResponse(
        id=str(action.id), action_type=action.action_type.value, target_type=action.target_type.value,
        target_id=str(action.target_id), record_hash=action.record_hash, evidence_ref=str(action.evidence_ref),
    )


@router.post("/patients/{patient_id}/flag", response_model=AdminActionResponse)
async def flag_patient(
    patient_id: str, body: FlagPatientRequest,
    service: EnforcementService = Depends(get_enforcement_service),
):
    action = await service.flag_patient(patient_id, body.admin_id, body.evidence_ref, body.rule_reason)
    return AdminActionResponse(
        id=str(action.id), action_type=action.action_type.value, target_type=action.target_type.value,
        target_id=str(action.target_id), record_hash=action.record_hash, evidence_ref=str(action.evidence_ref),
    )


@router.post("/flagged-queue/{candidate_id}/dismiss")
async def dismiss_candidate(
    candidate_id: str, body: DismissCandidateRequest,
    service: EnforcementService = Depends(get_enforcement_service),
):
    await service.dismiss_candidate(candidate_id, body.admin_id)
    return {"status": "dismissed"}


@router.get("/actions")
async def list_actions(session: AsyncSession = Depends(get_db_session)):
    repo = AdminActionRepository(session)
    actions = await repo.list_all()
    return [
        {
            "id": str(a.id), "action_type": a.action_type.value, "target_type": a.target_type.value,
            "target_id": str(a.target_id), "record_hash": a.record_hash,
            "previous_record_hash": a.previous_record_hash, "created_at": a.created_at.isoformat(),
        }
        for a in actions
    ]


@router.post("/keys/generate")
async def generate_admin_key(admin_id: str, session: AsyncSession = Depends(get_db_session)):
    service = AdminKeygenService(AdminRepository(session))
    public_key = await service.generate_and_store(admin_id)
    return {"public_key": public_key}