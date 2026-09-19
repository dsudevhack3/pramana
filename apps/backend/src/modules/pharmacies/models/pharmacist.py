import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Pharmacist(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    An actual account — not an anonymous scanner — so it can be suspended
    in Flow 5. Nullable pharmacy_id lets an invite be created before the
    pharmacy itself is fully approved, though scan-and-consume requires
    both pharmacy.status == APPROVED and pharmacist.is_suspended == False.
    """
    __tablename__ = "pharmacists"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    pharmacy_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=True
    )
    is_suspended: Mapped[bool] = mapped_column(default=False, nullable=False)