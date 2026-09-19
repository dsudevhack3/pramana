from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.organizations.models.organization import Organization, OrganizationStatus
from src.modules.organizations.models.organization_admin import OrganizationAdmin
from src.modules.organizations.models.organization_invite import InviteStatus, OrganizationInvite


class OrganizationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self, name: str, registration_number: str, registration_type: str,
        address_raw: str, place_id: str, lat: float, lng: float,
    ) -> Organization:
        org = Organization(
            name=name, registration_number=registration_number, registration_type=registration_type,
            address_raw=address_raw, maps_place_id=place_id, latitude=lat, longitude=lng,
        )
        self._session.add(org)
        await self._session.flush()
        return org

    async def get_by_id(self, organization_id: str) -> Organization | None:
        result = await self._session.execute(select(Organization).where(Organization.id == organization_id))
        return result.scalar_one_or_none()

    async def list_pending(self) -> list[Organization]:
        result = await self._session.execute(
            select(Organization).where(Organization.status == OrganizationStatus.PENDING)
        )
        return list(result.scalars().all())

    async def set_status(self, organization_id: str, status: OrganizationStatus) -> None:
        org = await self.get_by_id(organization_id)
        if org is None:
            raise ValueError(f"Organization {organization_id} not found")
        org.status = status
        await self._session.flush()


class OrganizationAdminRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, organization_id: str, email: str, password_hash: str, full_name: str) -> OrganizationAdmin:
        admin = OrganizationAdmin(
            organization_id=organization_id, email=email, password_hash=password_hash, full_name=full_name
        )
        self._session.add(admin)
        await self._session.flush()
        return admin

    async def get_by_email(self, email: str) -> OrganizationAdmin | None:
        result = await self._session.execute(select(OrganizationAdmin).where(OrganizationAdmin.email == email))
        return result.scalar_one_or_none()


class InviteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, organization_id: str, doctor_email: str, token: str) -> OrganizationInvite:
        invite = OrganizationInvite(organization_id=organization_id, doctor_email=doctor_email, token=token)
        self._session.add(invite)
        await self._session.flush()
        return invite

    async def get_by_token(self, token: str) -> OrganizationInvite | None:
        result = await self._session.execute(select(OrganizationInvite).where(OrganizationInvite.token == token))
        return result.scalar_one_or_none()

    async def mark_accepted(self, invite_id: str, doctor_id: str) -> None:
        result = await self._session.execute(select(OrganizationInvite).where(OrganizationInvite.id == invite_id))
        invite = result.scalar_one()
        invite.status = InviteStatus.ACCEPTED
        invite.doctor_id = doctor_id
        await self._session.flush()

    async def mark_status(self, invite_id: str, status: InviteStatus) -> None:
        result = await self._session.execute(select(OrganizationInvite).where(OrganizationInvite.id == invite_id))
        invite = result.scalar_one()
        invite.status = status
        await self._session.flush()