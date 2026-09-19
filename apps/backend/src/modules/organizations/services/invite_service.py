import secrets

from src.modules.organizations.models.organization_invite import InviteStatus
from src.modules.organizations.repository import InviteRepository


class InviteService:
    def __init__(self, repo: InviteRepository) -> None:
        self._repo = repo

    async def create_invite(self, organization_id: str, doctor_email: str) -> str:
        token = secrets.token_urlsafe(32)
        await self._repo.create(organization_id, doctor_email, token)
        # notifications/services/email_service.py sends the invite link — omitted here
        return token

    async def accept_invite(self, invite_token: str, doctor_id: str) -> str:
        """
        Returns organization_id. Accepting ONLY sets doctor.organization_id
        (via doctors/repository.py, called from the route layer) and adds
        a display badge — it never touches signing keys, license status,
        or trust tier calculation, per Flow 1 Step 6.
        """
        invite = await self._repo.get_by_token(invite_token)
        if invite is None or invite.status != InviteStatus.PENDING:
            raise ValueError("Invite not found or already used")

        await self._repo.mark_accepted(invite.id, doctor_id)
        return str(invite.organization_id)

    async def reject_invite(self, invite_token: str) -> None:
        invite = await self._repo.get_by_token(invite_token)
        if invite is None:
            raise ValueError("Invite not found")
        await self._repo.mark_status(invite.id, InviteStatus.REJECTED)