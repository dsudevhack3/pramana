from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.admin.models.admin_action import AdminAction


class AdminUser:
    """Lightweight placeholder model reference — full Admin account model below."""


from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from src.core.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Admin(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "admins"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    public_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    encrypted_private_key: Mapped[str | None] = mapped_column(String(2000), nullable=True)


class AdminRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, email: str, password_hash: str, full_name: str) -> Admin:
        admin = Admin(email=email, password_hash=password_hash, full_name=full_name)
        self._session.add(admin)
        await self._session.flush()
        return admin

    async def get_by_id(self, admin_id: str) -> Admin | None:
        result = await self._session.execute(select(Admin).where(Admin.id == admin_id))
        return result.scalar_one_or_none()

    async def store_keypair(self, admin_id: str, public_key_b64: str, encrypted_private_key: str) -> None:
        admin = await self.get_by_id(admin_id)
        if admin is None:
            raise ValueError(f"Admin {admin_id} not found")
        admin.public_key = public_key_b64
        admin.encrypted_private_key = encrypted_private_key
        await self._session.flush()


class AdminActionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[AdminAction]:
        result = await self._session.execute(select(AdminAction).order_by(AdminAction.created_at.desc()))
        return list(result.scalars().all())