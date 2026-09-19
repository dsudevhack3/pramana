import pytest

from src.modules.organizations.models.organization import Organization
from src.modules.organizations.repository import InviteRepository, OrganizationRepository
from src.modules.organizations.services.invite_service import InviteService


@pytest.mark.asyncio
async def test_accept_invite_returns_org_id(db_session):
    org_repo = OrganizationRepository(db_session)
    org = await org_repo.create(
        name="Org", registration_number="R1", registration_type="CIN",
        address_raw="addr", place_id="pid", lat=1.0, lng=1.0,
    )
    invite_repo = InviteRepository(db_session)
    service = InviteService(invite_repo)

    token = await service.create_invite(str(org.id), "doc@example.com")
    result_org_id = await service.accept_invite(token, "doctor-uuid-placeholder")
    assert result_org_id == str(org.id)


@pytest.mark.asyncio
async def test_accept_invite_twice_raises(db_session):
    org_repo = OrganizationRepository(db_session)
    org = await org_repo.create(
        name="Org", registration_number="R1", registration_type="CIN",
        address_raw="addr", place_id="pid", lat=1.0, lng=1.0,
    )
    invite_repo = InviteRepository(db_session)
    service = InviteService(invite_repo)
    token = await service.create_invite(str(org.id), "doc@example.com")
    await service.accept_invite(token, "doctor-uuid-1")

    with pytest.raises(ValueError, match="already used"):
        await service.accept_invite(token, "doctor-uuid-2")