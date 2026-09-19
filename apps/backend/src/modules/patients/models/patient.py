from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Patient(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "patients"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    dob: Mapped[str] = mapped_column(String(10), nullable=False)
    # No is_suspended / is_banned field exists on this model, deliberately —
    # patients cannot be locked out of healthcare (Flow 5 note, mirrors PDMP).