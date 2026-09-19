from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.core.exceptions.base_exceptions import AppError
from src.modules.doctors.repository import DoctorRepository
from src.modules.patients.repository import PatientFlagRepository
from src.modules.patients.services.patient_flag_service import PatientFlagService
from src.modules.prescriptions.repository import AmendmentRepository, PrescriptionRepository
from src.modules.prescriptions.schemas.prescription_schema import (
    PatientRiskWarning, PrescriptionAmendRequest, PrescriptionCreateRequest, PrescriptionResponse,
)
from src.modules.prescriptions.services.amendment_service import AmendmentService
from src.modules.prescriptions.services.drug_validation_service import DrugValidationService
from src.modules.prescriptions.services.patient_risk_check_service import PatientRiskCheckService
from src.modules.prescriptions.services.signing_orchestrator import SigningOrchestrator

router = APIRouter()


def get_orchestrator(session: AsyncSession = Depends(get_db_session)) -> SigningOrchestrator:
    return SigningOrchestrator(
        PrescriptionRepository(session), DoctorRepository(session), DrugValidationService(), session
    )


@router.get("/patients/{patient_id}/risk-check", response_model=PatientRiskWarning)
async def risk_check(patient_id: str, session: AsyncSession = Depends(get_db_session)):
    service = PatientRiskCheckService(PatientFlagService(PatientFlagRepository(session)))
    return await service.check(patient_id)


@router.post("", response_model=PrescriptionResponse)
async def create_prescription(
    body: PrescriptionCreateRequest, orchestrator: SigningOrchestrator = Depends(get_orchestrator)
):
    try:
        prescription = await orchestrator.sign_and_submit(body)
    except AppError as exc:
        raise HTTPException(exc.status_code, exc.detail) from exc
    return PrescriptionResponse.model_validate(prescription)


@router.post("/amend", response_model=PrescriptionResponse)
async def amend_prescription(
    body: PrescriptionAmendRequest, session: AsyncSession = Depends(get_db_session)
):
    orchestrator = SigningOrchestrator(
        PrescriptionRepository(session), DoctorRepository(session), DrugValidationService(), session
    )
    service = AmendmentService(
        PrescriptionRepository(session), AmendmentRepository(session), orchestrator
    )
    try:
        new_prescription = await service.amend(body)
    except AppError as exc:
        raise HTTPException(exc.status_code, exc.detail) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return PrescriptionResponse.model_validate(new_prescription)


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(prescription_id: str, session: AsyncSession = Depends(get_db_session)):
    repo = PrescriptionRepository(session)
    prescription = await repo.get_by_id(prescription_id)
    if prescription is None:
        raise HTTPException(404, "Prescription not found")
    return PrescriptionResponse.model_validate(prescription)