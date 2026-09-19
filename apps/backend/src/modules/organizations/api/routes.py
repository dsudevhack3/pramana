from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.core.security.jwt import TokenPayload
from src.core.security.rbac import require_admin, require_org_admin
from src.modules.doctors.models.doctor import Doctor
from src.modules.doctors.repository import DoctorRepository
from src.modules.organizations.models.organization_invite import OrganizationInvite
from src.modules.organizations.repository import (
    InviteRepository, OrganizationAdminRepository, OrganizationRepository,
)
from src.modules.organizations.schemas.organization_schema import (
    InviteAcceptRequest, InviteDoctorRequest, OrgApprovalRequest,
    OrganizationResponse, OrgSignupRequest,
)
from src.modules.organizations.services.invite_service import InviteService
from src.modules.organizations.services.mca_gst_verification_client import McaGstVerificationClient
from src.modules.organizations.services.org_maps_verification_service import OrgMapsVerificationService
from src.modules.organizations.services.org_onboarding_service import OrgOnboardingService

router = APIRouter()


def get_onboarding_service(session: AsyncSession = Depends(get_db_session)) -> OrgOnboardingService:
    return OrgOnboardingService(
        OrganizationRepository(session), OrganizationAdminRepository(session),
        McaGstVerificationClient(), OrgMapsVerificationService(),
    )


@router.get("/me", response_model=OrganizationResponse, dependencies=[Depends(require_org_admin)])
async def get_my_organization(
    current_user: TokenPayload = Depends(require_org_admin),
    session: AsyncSession = Depends(get_db_session),
):
    if not current_user.org_id:
        raise HTTPException(status_code=404, detail="No organization linked to this account")

    repo = OrganizationRepository(session)
    org = await repo.get_by_id(current_user.org_id)

    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    return OrganizationResponse.model_validate(org)


@router.get("/me/roster", dependencies=[Depends(require_org_admin)])
async def get_my_roster(
    current_user: TokenPayload = Depends(require_org_admin),
    session: AsyncSession = Depends(get_db_session),
):
    if not current_user.org_id:
        raise HTTPException(status_code=404, detail="No organization linked to this account")

    result = await session.execute(
        select(Doctor).where(Doctor.organization_id == current_user.org_id)
    )
    doctors = result.scalars().all()

    return [
        {
            "id": str(d.id),
            "full_name": d.full_name,
            "license_status": d.license_status.value
            if hasattr(d.license_status, "value")
            else str(d.license_status),
            "is_suspended": d.is_suspended,
        }
        for d in doctors
    ]


@router.get("/me/invites", dependencies=[Depends(require_org_admin)])
async def get_my_invites(
    current_user: TokenPayload = Depends(require_org_admin),
    session: AsyncSession = Depends(get_db_session),
):
    if not current_user.org_id:
        raise HTTPException(status_code=404, detail="No organization linked to this account")

    result = await session.execute(
        select(OrganizationInvite).where(OrganizationInvite.organization_id == current_user.org_id)
    )
    invites = result.scalars().all()

    return [
        {
            "id": str(i.id),
            "doctor_email": i.doctor_email,
            "status": i.status.value if hasattr(i.status, "value") else str(i.status),
        }
        for i in invites
    ]


@router.post("/signup", response_model=OrganizationResponse)
async def signup(body: OrgSignupRequest, service: OrgOnboardingService = Depends(get_onboarding_service)):
    try:
        org = await service.signup(body)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return OrganizationResponse.model_validate(org)


@router.post("/approve", dependencies=[Depends(require_admin)])
async def approve(body: OrgApprovalRequest, service: OrgOnboardingService = Depends(get_onboarding_service)):
    await service.approve(body.organization_id)
    return {"status": "verified"}


@router.post("/reject", dependencies=[Depends(require_admin)])
async def reject(body: OrgApprovalRequest, service: OrgOnboardingService = Depends(get_onboarding_service)):
    await service.reject(body.organization_id)
    return {"status": "rejected"}


@router.get("/pending", dependencies=[Depends(require_admin)])
async def list_pending(session: AsyncSession = Depends(get_db_session)):
    repo = OrganizationRepository(session)
    return [OrganizationResponse.model_validate(o) for o in await repo.list_pending()]


@router.post("/invites", dependencies=[Depends(require_org_admin)])
async def invite_doctor(body: InviteDoctorRequest, session: AsyncSession = Depends(get_db_session)):
    service = InviteService(InviteRepository(session))
    token = await service.create_invite(body.organization_id, body.doctor_email)
    return {"invite_token": token}


@router.post("/invites/accept")
async def accept_invite(body: InviteAcceptRequest, session: AsyncSession = Depends(get_db_session)):
    service = InviteService(InviteRepository(session))
    try:
        organization_id = await service.accept_invite(body.invite_token, body.doctor_id)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc

    # Only sets the FK — no signing key / license / trust-tier changes.
    doctor_repo = DoctorRepository(session)
    await doctor_repo.set_organization(body.doctor_id, organization_id)
    return {"status": "accepted", "organization_id": organization_id}