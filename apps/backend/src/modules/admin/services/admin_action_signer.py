"""
Signs every enforcement action with the admin's private key and appends
it to the shared hash chain. The second (and last) writer to
core/security/crypto/hash_chain.py, alongside signing_orchestrator.py.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security.crypto.hash_chain import append_to_chain
from src.core.security.crypto.signer import canonicalize, sign_payload
from src.core.security.crypto.verifier import verify_signature
from src.core.exceptions.domain_exceptions import HashChainIntegrityError
from src.modules.admin.models.admin_action import ActionType, AdminAction
from src.modules.admin.services.admin_keygen_service import AdminKeygenService
from src.modules.flagging.models.flagged_candidate import TargetType
from src.modules.admin.repository import AdminRepository


class AdminActionSigner:
    def __init__(self, keygen_service: AdminKeygenService, admin_repo: AdminRepository, session: AsyncSession) -> None:
        self._keygen_service = keygen_service
        self._admin_repo = admin_repo
        self._session = session

    async def sign_and_record(
        self, admin_id: str, action_type: ActionType, target_type: TargetType,
        target_id: str, evidence_ref: str, reason_note: str | None,
    ) -> AdminAction:
        admin = await self._admin_repo.get_by_id(admin_id)
        if admin is None or admin.public_key is None:
            raise ValueError("Admin has no registered signing key")

        payload = {
            "admin_id": admin_id, "action_type": action_type.value,
            "target_type": target_type.value, "target_id": target_id,
            "evidence_ref": evidence_ref,
        }
        canonical_payload = canonicalize(payload)

        private_key = await self._keygen_service.load_private_key(admin_id)
        signature = sign_payload(private_key, canonical_payload)

        # Paranoia check — verify our own signature before writing it,
        # so a broken keygen/signer never produces an unverifiable
        # ledger entry.
        if not verify_signature(admin.public_key, canonical_payload, signature):
            raise HashChainIntegrityError("Self-verification of admin action signature failed")

        new_hash, previous_hash = await append_to_chain(self._session, canonical_payload)

        action = AdminAction(
            admin_id=admin_id, action_type=action_type, target_type=target_type,
            target_id=target_id, evidence_ref=evidence_ref, reason_note=reason_note,
            record_hash=new_hash, previous_record_hash=previous_hash,
            signature=signature, signer_public_key_ref=admin.public_key,
        )
        self._session.add(action)
        await self._session.flush()
        return action