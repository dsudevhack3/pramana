"""
Signature verification. Used by:
  - signing_orchestrator.py (prescriptions/) — verifies doctor's signature
    against their stored public key before accepting a new prescription
  - admin_action_signer.py (admin/) — verifies its own output as a
    paranoia check right after signing, before writing to DB
  - integrity_checker (workers/) — re-verifies historical signatures
    during periodic hash-chain audits
"""
import base64

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from src.core.security.crypto.keygen import load_public_key


class SignatureVerificationError(Exception):
    """Raised when a signature does not match the given public key + payload."""


def verify_signature(public_key_b64: str, canonical_payload: bytes, signature_b64: str) -> bool:
    public_key: Ed25519PublicKey = load_public_key(public_key_b64)
    signature = base64.b64decode(signature_b64)
    try:
        public_key.verify(signature, canonical_payload)
        return True
    except InvalidSignature:
        return False


def verify_or_raise(public_key_b64: str, canonical_payload: bytes, signature_b64: str) -> None:
    if not verify_signature(public_key_b64, canonical_payload, signature_b64):
        raise SignatureVerificationError(
            "Signature does not match payload for the given public key."
        )