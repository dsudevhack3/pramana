from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.modules.doctors.repository import DoctorRepository
from src.modules.doctors.schemas.doctor_schema import (
    DoctorProfileResponse, DoctorSignupRequest, LicenseVerifyRequest,
    PlatformRegistrationRequest, SigningKeyRegisterRequest,
)
from src.modules.doctors.services.medical_registry_client import MedicalRegistryClient
from src.modules.doctors.services.onboarding_service import OnboardingService
from src.modules.identity.repository import IdentityRepository

router = APIRouter()


def get_onboarding_service(session: AsyncSession = Depends(get_db_session)) -> OnboardingService:
    return OnboardingService(
        DoctorRepository(session), IdentityRepository(session), MedicalRegistryClient()
    )


@router.post("/signup", response_model=DoctorProfileResponse)
async def signup(body: DoctorSignupRequest, service: OnboardingService = Depends(get_onboarding_service)):
    doctor = await service.signup(body)
    return DoctorProfileResponse.model_validate(doctor)


@router.post("/verify-license")
async def verify_license(
    body: LicenseVerifyRequest, service: OnboardingService = Depends(get_onboarding_service)
):
    outcome = await service.verify_license(body.doctor_id, body.license_number, body.council_name)
    return {"outcome": outcome}


@router.post("/signing-key")
async def register_signing_key(
    body: SigningKeyRegisterRequest, service: OnboardingService = Depends(get_onboarding_service)
):
    await service.register_signing_key(body.doctor_id, body.public_key_b64)
    return {"status": "ok"}


@router.post("/platform-registration")
async def opt_into_platform(
    body: PlatformRegistrationRequest, service: OnboardingService = Depends(get_onboarding_service)
):
    await service.opt_into_platform(body.doctor_id)
    return {"status": "pending"}


@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
async def get_profile(doctor_id: str, session: AsyncSession = Depends(get_db_session)):
    repo = DoctorRepository(session)
    doctor = await repo.get_by_id(doctor_id)
    if doctor is None:
        from fastapi import HTTPException
        raise HTTPException(404, "Doctor not found")
    return DoctorProfileResponse.model_validate(doctor)