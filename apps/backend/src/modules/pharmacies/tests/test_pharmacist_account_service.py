import pytest

from src.modules.pharmacies.models.pharmacy import PharmacyStatus
from src.modules.pharmacies.repository import PharmacistRepository, PharmacyRepository
from src.modules.pharmacies.schemas.pharmacist_schema import PharmacistSignupRequest
from src.modules.pharmacies.services.pharmacist_account_service import PharmacistAccountService


@pytest.mark.asyncio
async def test_cannot_create_pharmacist_for_unapproved_pharmacy(db_session):
    pharmacy_repo = PharmacyRepository(db_session)
    pharmacy = await pharmacy_repo.create(
        name="P", license_number="L1", state_council_name="C1",
        address_raw="addr", place_id="pid", lat=1.0, lng=1.0,
    )
    service = PharmacistAccountService(PharmacistRepository(db_session), pharmacy_repo)

    with pytest.raises(ValueError, match="must be APPROVED"):
        await service.create_pharmacist(PharmacistSignupRequest(
            email="p@example.com", password="pw123456", full_name="Pharmacist One",
            pharmacy_id=str(pharmacy.id),
        ))


@pytest.mark.asyncio
async def test_suspended_pharmacist_cannot_scan(db_session):
    pharmacy_repo = PharmacyRepository(db_session)
    pharmacy = await pharmacy_repo.create(
        name="P", license_number="L1", state_council_name="C1",
        address_raw="addr", place_id="pid", lat=1.0, lng=1.0,
    )
    await pharmacy_repo.set_status(str(pharmacy.id), PharmacyStatus.APPROVED)

    pharmacist_repo = PharmacistRepository(db_session)
    service = PharmacistAccountService(pharmacist_repo, pharmacy_repo)
    pharmacist = await service.create_pharmacist(PharmacistSignupRequest(
        email="p@example.com", password="pw123456", full_name="Pharmacist One",
        pharmacy_id=str(pharmacy.id),
    ))

    await pharmacist_repo.set_suspended(str(pharmacist.id), is_suspended=True)
    can_scan = await service.can_scan_and_consume(str(pharmacist.id))
    assert can_scan is False