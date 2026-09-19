"""
One-time Ed25519 keypair generation for admin accounts, mirroring
doctors' Step 4 pattern — with one documented difference: the private
key IS held (encrypted at rest) server-side for admins, so background
enforcement can be signed without requiring a live browser session.
See signer.py's module docstring for the full rationale.
"""
from cryptography.fernet import Fernet

from src.config.settings import get_settings
from src.core.security.crypto.keygen import generate_keypair
from src.modules.admin.repository import AdminRepository

settings = get_settings()
_fernet = Fernet(Fernet.generate_key())  # in production: loaded from a KMS-backed secret, not generated at import time


class AdminKeygenService:
    def __init__(self, repo: AdminRepository) -> None:
        self._repo = repo

    async def generate_and_store(self, admin_id: str) -> str:
        keypair = generate_keypair()
        encrypted_private_key = _fernet.encrypt(keypair.private_key_pem)
        await self._repo.store_keypair(admin_id, keypair.public_key_b64, encrypted_private_key.decode("ascii"))
        return keypair.public_key_b64

    async def load_private_key(self, admin_id: str):
        from cryptography.hazmat.primitives.serialization import load_pem_private_key

        admin = await self._repo.get_by_id(admin_id)
        if admin is None or admin.encrypted_private_key is None:
            raise ValueError("Admin has no signing key set up — run Settings > AdminKeySetupPage first")
        decrypted = _fernet.decrypt(admin.encrypted_private_key.encode("ascii"))
        return load_pem_private_key(decrypted, password=None)