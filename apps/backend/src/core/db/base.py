"""
Declarative base + shared mixins. Every model in the codebase inherits
TimestampMixin at minimum; models that participate in the hash chain
(prescriptions, admin_action) additionally inherit HashChainMixin so the
chain-linking columns are defined in exactly one place.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )


class HashChainMixin:
    """
    Shared by prescription.py and admin_action.py — the two record types
    that append to the same tamper-evident chain (core/security/crypto/hash_chain.py).

    record_hash = SHA256(canonical_payload + previous_record_hash)

    Deliberately NOT a foreign key to itself across tables — the chain is
    logical/cross-table, linked by hash value, not by DB relationship,
    because prescriptions and admin_action actions interleave in one
    global sequence.
    """
    record_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    previous_record_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    signature: Mapped[str] = mapped_column(String(512), nullable=False)
    signer_public_key_ref: Mapped[str] = mapped_column(String(255), nullable=False)