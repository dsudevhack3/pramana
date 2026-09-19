from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.modules.clinics.repository import ClinicRepository
from src.modules.clinics.schemas.clinic_schema import (
    ClinicAddressSubmitRequest, ClinicDocumentSubmitRequest,
    ClinicPhotoSubmitRequest, ClinicVerificationResponse,
)
from src.modules.clinics.services.clinic_document_service import (
    cross_check_registration_number, validate_photo_location,
)
from src.modules.clinics.services.maps_verification_service import MapsVerificationService

router = APIRouter()


@router.post("/address", response_model=ClinicVerificationResponse)
async def submit_address(
    body: ClinicAddressSubmitRequest, session: AsyncSession = Depends(get_db_session)
):
    maps = MapsVerificationService()
    result = await maps.confirm_address(body.address_raw)
    if result is None:
        raise HTTPException(422, "Could not confirm clinic address via Google Maps")

    repo = ClinicRepository(session)
    clinic = await repo.upsert_address(
        body.doctor_id, body.address_raw, result.place_id, result.latitude, result.longitude
    )
    return ClinicVerificationResponse.model_validate(clinic)


@router.post("/photo")
async def submit_photo(
    body: ClinicPhotoSubmitRequest, session: AsyncSession = Depends(get_db_session)
):
    repo = ClinicRepository(session)
    clinic = await repo.get_by_doctor_id(body.doctor_id)
    if clinic is None:
        raise HTTPException(422, "Submit clinic address before photo")

    if not validate_photo_location(body.capture_lat, body.capture_lng, clinic.latitude, clinic.longitude):
        raise HTTPException(422, "Photo location too far from confirmed clinic address")

    # Upload body.photo_base64 to blob storage — omitted here for brevity.
    photo_url = f"https://storage.example.com/clinic-photos/{body.doctor_id}.jpg"
    await repo.attach_photo(body.doctor_id, photo_url, body.capture_lat, body.capture_lng)
    return {"status": "photo_attached"}


@router.post("/registration-doc")
async def submit_registration_doc(
    body: ClinicDocumentSubmitRequest, session: AsyncSession = Depends(get_db_session)
):
    cross_checked = await cross_check_registration_number(body.clinical_establishment_reg_number)
    repo = ClinicRepository(session)
    clinic = await repo.attach_registration_doc(
        body.doctor_id, body.clinical_establishment_reg_number, cross_checked
    )
    if clinic.geotagged_photo_url:
        await repo.mark_verified(body.doctor_id)
    return {"status": "ok", "cross_checked": cross_checked}