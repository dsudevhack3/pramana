import pytest
from unittest.mock import AsyncMock

from src.core.exceptions.domain_exceptions import HashChainIntegrityError
from src.core.security.crypto.keygen import generate_keypair
from src.modules.admin.models.admin_action import ActionType
from src.modules.admin.services.admin_action_signer import AdminActionSigner
from src.modules.flagging.models.flagged_candidate import TargetType


@pytest.mark.asyncio
async def test_sign_and_record_raises_when_no_signing_key(db_session):
    admin_repo = AsyncMock()
    admin_repo.get_by_id.return_value = AsyncMock(public_key=None)
    signer = AdminActionSigner(AsyncMock(), admin_repo, db_session)

    with pytest.raises(ValueError, match="no registered signing key"):
        await signer.sign_and_record(
            "admin-1", ActionType.SUSPEND_DOCTOR, TargetType.DOCTOR, "doc-1", "ev-1", None
        )


@pytest.mark.asyncio
async def test_self_verification_catches_signature_mismatch(db_session):
    """If keygen/signer produce a bad signature, the paranoia self-check must catch it before writing."""
    keypair = generate_keypair()
    admin_repo = AsyncMock()
    admin_repo.get_by_id.return_value = AsyncMock(public_key=keypair.public_key_b64)

    keygen_service = AsyncMock()
    # Return a mismatched key so verify_signature fails deliberately.
    other_keypair = generate_keypair()
    from cryptography.hazmat.primitives.serialization import load_pem_private_key
    keygen_service.load_private_key.return_value = load_pem_private_key(
        other_keypair.private_key_pem, password=None
    )

    signer = AdminActionSigner(keygen_service, admin_repo, db_session)
    with pytest.raises(HashChainIntegrityError):
        await signer.sign_and_record(
            "admin-1", ActionType.SUSPEND_DOCTOR, TargetType.DOCTOR, "doc-1", "ev-1", None
        )