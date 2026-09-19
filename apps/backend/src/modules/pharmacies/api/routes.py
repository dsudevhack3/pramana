from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.core.security.rbac import require_admin
from src.modules.clinics.services.maps_verification_service import MapsVerificationService
from src.modules.pharmacies.repository import PharmacistRepository, PharmacyRepository
from src.modules.pharmacies.schemas.pharmacist_schema import PharmacistResponse, PharmacistSignupRequest
from src.modules.pharmacies.schemas.pharmacy_schema import (
    PharmacyApprovalRequest, PharmacyResponse, PharmacySignupRequest,
)
from src.modules.pharmacies.services.pharmacist_account_service import PharmacistAccountService
from src.modules.pharmacies.services.pharmacy_license_verification_client import (
    PharmacyLicenseVerificationClient,
)
from src.modules.pharmacies.services.pharmacy_onboarding_service import PharmacyOnboardingService

router = APIRouter()


def get_onboarding_service(session: AsyncSession = Depends(get_db_session)) -> PharmacyOnboardingService:
    return PharmacyOnboardingService(
        PharmacyRepository(session), MapsVerificationService(), PharmacyLicenseVerificationClient()
    )


@router.post("/signup", response_model=PharmacyResponse)
async def signup(body: PharmacySignupRequest, service: PharmacyOnboardingService = Depends(get_onboarding_service)):
    try:
        pharmacy = await service.signup(body)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return PharmacyResponse.model_validate(pharmacy)


@router.post("/approve", dependencies=[Depends(require_admin)])
async def approve(body: PharmacyApprovalRequest, service: PharmacyOnboardingService = Depends(get_onboarding_service)):
    await service.approve(body.pharmacy_id)
    return {"status": "approved"}


@router.post("/reject", dependencies=[Depends(require_admin)])
async def reject(body: PharmacyApprovalRequest, service: PharmacyOnboardingService = Depends(get_onboarding_service)):
    await service.reject(body.pharmacy_id)
    return {"status": "rejected"}


@router.get("/pending", dependencies=[Depends(require_admin)])
async def list_pending(session: AsyncSession = Depends(get_db_session)):
    repo = PharmacyRepository(session)
    pending = await repo.list_pending()
    return [PharmacyResponse.model_validate(p) for p in pending]


@router.post("/pharmacists/signup", response_model=PharmacistResponse)
async def signup_pharmacist(body: PharmacistSignupRequest, session: AsyncSession = Depends(get_db_session)):
    service = PharmacistAccountService(PharmacistRepository(session), PharmacyRepository(session))
    try:
        pharmacist = await service.create_pharmacist(body)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return PharmacistResponse.model_validate(pharmacist)