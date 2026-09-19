import uuid

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Clinic(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "clinics"

    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id"), unique=True, nullable=False
    )
    address_raw: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    maps_place_id: Mapped[str] = mapped_column(String(255), nullable=False)

    clinical_establishment_reg_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reg_number_cross_checked: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Live, in-app camera capture only — never a gallery upload. Enforced
    # client-side (ClinicStep.tsx) and validated server-side via EXIF/
    # capture-metadata check in clinic_document_service.py.
    geotagged_photo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    photo_lat: Mapped[float] = mapped_column(Float, nullable=False)
    photo_lng: Mapped[float] = mapped_column(Float, nullable=False)

    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)