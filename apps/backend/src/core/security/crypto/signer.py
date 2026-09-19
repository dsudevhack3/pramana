"""
Signing helpers.

The server never signs a *prescription* — that happens client-side with
the doctor's private key (Flow 2). This module is used for:
  1. Verifying signatures submitted by clients (doctors, admins) — see
     verifier.py, the actual verification counterpart.
  2. Server-side signing ONLY for admin_action records, using the admin's
     private key which — per admin_keygen_service.py — is held encrypted
     server-side for this one workflow (unlike doctors' keys). This is a
     deliberate, documented exception: admin enforcement actions must be
     signable even if the admin isn't present in a browser session when
     a background process needs to timestamp an escalation.

If product decides admin keys should also go client-side-only, this is
the only file that needs to change — enforcement_service.py just calls
`sign_payload()` and doesn't know where the key lives.
"""
import base64
from typing import Protocol

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey


class KeyProvider(Protocol):
    async def get_private_key(self, key_ref: str) -> Ed25519PrivateKey: ...


def sign_payload(private_key: Ed25519PrivateKey, canonical_payload: bytes) -> str:
    """Returns base64-encoded signature."""
    signature = private_key.sign(canonical_payload)
    return base64.b64encode(signature).decode("ascii")


def canonicalize(payload: dict) -> bytes:
    """
    Deterministic JSON serialization so the same logical payload always
    produces the same bytes to sign/verify — sorted keys, no whitespace,
    no locale-dependent number formatting.
    """
    import json

    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode(
        "utf-8"
    )