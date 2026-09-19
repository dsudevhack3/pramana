from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.core.security.password_hasher import hash_password
from src.core.security.rbac import require_doctor
from src.core.security.jwt import TokenPayload
from src.modules.doctors.repository import DoctorRepository
from src.modules.doctors.schemas.doctor_schema import (
    DoctorSignupRequest,
    DoctorProfileResponse,
)

router = APIRouter()


@router.post("/signup", response_model=DoctorProfileResponse)
async def signup_doctor(
    body: DoctorSignupRequest,
    session: AsyncSession = Depends(get_db_session),
):
    repo = DoctorRepository(session)

    try:
        doctor = await repo.create(
            email=body.email,
            password_hash=hash_password(body.password),
            full_name=body.full_name,
        )

        await session.commit()

        return DoctorProfileResponse(
            id=str(doctor.id),
            full_name=doctor.full_name,
            license_status=doctor.license_status.value
            if hasattr(doctor.license_status, "value")
            else str(doctor.license_status),
            platform_status=doctor.platform_status.value
            if hasattr(doctor.platform_status, "value")
            else str(doctor.platform_status),
            organization_id=str(doctor.organization_id)
            if doctor.organization_id
            else None,
            is_suspended=doctor.is_suspended,
        )

    except ValueError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.get("/me", response_model=DoctorProfileResponse)
async def get_my_profile(
    current_user: TokenPayload = Depends(require_doctor),
    session: AsyncSession = Depends(get_db_session),
):
    repo = DoctorRepository(session)

    doctor = await repo.get_by_id(current_user.sub)

    if doctor is None:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found",
        )

    return DoctorProfileResponse(
        id=str(doctor.id),
        full_name=doctor.full_name,
        license_status=doctor.license_status.value
        if hasattr(doctor.license_status, "value")
        else str(doctor.license_status),
        platform_status=doctor.platform_status.value
        if hasattr(doctor.platform_status, "value")
        else str(doctor.platform_status),
        organization_id=str(doctor.organization_id)
        if doctor.organization_id
        else None,
        is_suspended=doctor.is_suspended,
    )


@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
async def get_doctor(
    doctor_id: str,
    session: AsyncSession = Depends(get_db_session),
):
    repo = DoctorRepository(session)

    doctor = await repo.get_by_id(doctor_id)

    if doctor is None:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found",
        )

    return DoctorProfileResponse(
        id=str(doctor.id),
        full_name=doctor.full_name,
        license_status=doctor.license_status.value
        if hasattr(doctor.license_status, "value")
        else str(doctor.license_status),
        platform_status=doctor.platform_status.value
        if hasattr(doctor.platform_status, "value")
        else str(doctor.platform_status),
        organization_id=str(doctor.organization_id)
        if doctor.organization_id
        else None,
        is_suspended=doctor.is_suspended,
    )