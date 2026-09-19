from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.core.exceptions.domain_exceptions import (
    PharmacistSuspendedError, TokenAlreadyConsumedError,
)
from src.core.security.crypto.hash_chain import verify_chain_integrity
from src.core.security.crypto.signer import canonicalize
from src.core.security.crypto.verifier import verify_signature
from src.modules.doctors.repository import DoctorRepository
from src.modules.pharmacies.repository import PharmacistRepository, PharmacyRepository
from src.modules.pharmacies.services.pharmacist_account_service import PharmacistAccountService
from src.modules.prescriptions.repository import PrescriptionRepository
from src.modules.verification.schemas.verification_schema import (
    ConsumeTokenRequest, VerificationLookupRequest, VerificationResponse,
)
from src.modules.verification.services.trust_tier_resolver import resolve_trust_tier

router = APIRouter()


@router.post("/lookup", response_model=VerificationResponse)
async def lookup(body: VerificationLookupRequest, session: AsyncSession = Depends(get_db_session)):
    repo = PrescriptionRepository(session)
    prescription = await repo.get_by_token(body.token_or_id) or await repo.get_by_id(body.token_or_id)
    if prescription is None:
        raise HTTPException(404, "Prescription not found")

    # Resolve LATEST non-voided version in the chain, showing lineage if amended.
    latest = await repo.get_latest_version_in_chain(str(prescription.id))
    is_amended = str(latest.id) != str(prescription.id)

    doctor_repo = DoctorRepository(session)
    doctor = await doctor_repo.get_by_id(str(latest.doctor_id))

    canonical_payload = canonicalize(latest.payload)
    signature_valid = verify_signature(latest.signer_public_key_ref, canonical_payload, latest.signature)

    broken_links = await verify_chain_integrity(session)
    hash_chain_intact = latest.record_hash not in broken_links

    trust_tier = resolve_trust_tier(latest)

    return VerificationResponse(
        prescription_id=str(latest.id),
        doctor_name=doctor.full_name if doctor else "Unknown",
        doctor_license_status_at_signing=latest.doctor_license_status_at_signing,
        trust_tier=trust_tier,
        drug_lines=latest.payload.get("drug_lines", []),
        signature_valid=signature_valid,
        hash_chain_intact=hash_chain_intact,
        is_amended=is_amended,
        latest_version_id=str(latest.id),
    )


@router.post("/consume")
async def consume_token(body: ConsumeTokenRequest, session: AsyncSession = Depends(get_db_session)):
    pharmacist_service = PharmacistAccountService(
        PharmacistRepository(session), PharmacyRepository(session)
    )
    # Scan-and-consume now also checks pharmacist.is_suspended (v2 addition).
    can_consume = await pharmacist_service.can_scan_and_consume(body.pharmacist_id)
    if not can_consume:
        raise HTTPException(403, "Pharmacist or pharmacy suspended/not approved")

    repo = PrescriptionRepository(session)
    prescription = await repo.get_by_token(body.token)
    if prescription is None:
        raise HTTPException(404, "Token not found")

    from src.modules.verification.models.token_consumption import TokenConsumption  # see below
    from sqlalchemy import select

    existing = await session.execute(
        select(TokenConsumption).where(TokenConsumption.prescription_token == body.token)
    )
    if existing.scalar_one_or_none() is not None:
        raise TokenAlreadyConsumedError()

    session.add(TokenConsumption(prescription_token=body.token, pharmacist_id=body.pharmacist_id))
    await session.flush()
    return {"status": "consumed"}