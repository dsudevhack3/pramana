import base64
from dataclasses import dataclass

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)


@dataclass(frozen=True)
class KeyPair:
    private_key_pem: bytes
    public_key_b64: str


def generate_keypair() -> KeyPair:
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    public_key_raw = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )

    public_key_b64 = base64.b64encode(public_key_raw).decode("ascii")

    return KeyPair(
        private_key_pem=private_key_pem,
        public_key_b64=public_key_b64,
    )


def load_public_key(public_key_b64: str) -> Ed25519PublicKey:
    try:
        public_key_raw = base64.b64decode(public_key_b64, validate=True)
        return Ed25519PublicKey.from_public_bytes(public_key_raw)
    except Exception as exc:
        raise ValueError("Invalid Ed25519 public key") from exc