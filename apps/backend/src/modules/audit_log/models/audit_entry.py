from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AuditEntry(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Generic, best-effort system-event logging — distinct from AdminAction,
    which is the cryptographically signed enforcement ledger. This table
    can be lossy/pruned; AdminAction cannot.
    """
    __tablename__ = "audit_entries"

    actor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    actor_role: Mapped[str | None] = mapped_column(String(30), nullable=True)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True)