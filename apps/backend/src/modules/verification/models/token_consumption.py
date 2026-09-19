import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class TokenConsumption(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Records a single-use token being marked consumed. A second scan
    attempt hitting a UNIQUE constraint on prescription_token is the
    reuse-fraud guard described in Flow 3.
    """
    __tablename__ = "token_consumptions"

    prescription_token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    pharmacist_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pharmacists.id"), nullable=False
    )