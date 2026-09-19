from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.modules.patients.repository import PatientFlagRepository, PatientRepository
from src.modules.patients.schemas.patient_schema import (
    PatientFlagResponse, PatientIdentityBindRequest, PatientOtpVerifyRequest, PatientResponse,
)
from src.modules.patients.services.patient_flag_service import PatientFlagService
from src.modules.patients.services.patient_identity_service import PatientIdentityService

router = APIRouter()


@router.post("/bind")
async def bind_identity(body: PatientIdentityBindRequest, session: AsyncSession = Depends(get_db_session)):
    service = PatientIdentityService(PatientRepository(session))
    patient_id = await service.bind_identity(body)
    return {"patient_id": patient_id}


@router.post("/verify-otp")
async def verify_otp(body: PatientOtpVerifyRequest, session: AsyncSession = Depends(get_db_session)):
    service = PatientIdentityService(PatientRepository(session))
    ok = await service.verify_otp(body.patient_id, body.otp)
    if not ok:
        raise HTTPException(422, "Invalid or expired OTP")
    return {"status": "verified"}


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, session: AsyncSession = Depends(get_db_session)):
    repo = PatientRepository(session)
    patient = await repo.get_by_id(patient_id)
    if patient is None:
        raise HTTPException(404, "Patient not found")
    return PatientResponse.model_validate(patient)


@router.get("/{patient_id}/flags", response_model=list[PatientFlagResponse])
async def get_flags(patient_id: str, session: AsyncSession = Depends(get_db_session)):
    service = PatientFlagService(PatientFlagRepository(session))
    flags = await service.get_active_flags(patient_id)
    return [PatientFlagResponse.model_validate(f) for f in flags]