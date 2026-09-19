from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.core.security.rbac import require_admin
from src.modules.doctors.repository import DoctorRepository
from src.modules.platform_registration.repository import PlatformRegistrationRepository
from src.modules.platform_registration.schemas.registration_schema import (
    RegistrationApprovalRequest, RegistrationOptInRequest, RegistrationStatusResponse,
)
from src.modules.platform_registration.services.registration_service import RegistrationService

router = APIRouter()


def get_service(session: AsyncSession = Depends(get_db_session)) -> RegistrationService:
    return RegistrationService(PlatformRegistrationRepository(session), DoctorRepository(session))


@router.post("/opt-in")
async def opt_in(body: RegistrationOptInRequest, service: RegistrationService = Depends(get_service)):
    await service.opt_in(body.doctor_id)
    return {"status": "pending"}


@router.post("/approve", dependencies=[Depends(require_admin)])
async def approve(body: RegistrationApprovalRequest, service: RegistrationService = Depends(get_service)):
    await service.approve(body.doctor_id)
    return {"status": "active"}


@router.get("/{doctor_id}", response_model=RegistrationStatusResponse)
async def get_status(doctor_id: str, service: RegistrationService = Depends(get_service)):
    status = await service.get_status(doctor_id)
    if status is None:
        raise HTTPException(404, "No platform registration found")
    return RegistrationStatusResponse(doctor_id=doctor_id, status=status.value)