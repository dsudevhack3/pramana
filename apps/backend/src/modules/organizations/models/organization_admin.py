import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class OrganizationAdmin(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    An org-admin account. Explicitly does NOT hold or touch any doctor's
    signing key, and role rbac.Role.ORG_ADMIN never satisfies
    require_admin — org-admins have zero Flow 5 authority.
    """
    __tablename__ = "organization_admins"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)