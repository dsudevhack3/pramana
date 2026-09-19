import pytest

from src.modules.admin.repository import AdminRepository
from src.modules.admin.services.admin_keygen_service import AdminKeygenService


@pytest.mark.asyncio
async def test_generate_and_store_roundtrips_private_key(db_session):
    repo = AdminRepository(db_session)
    admin = await repo.create(email="admin@example.com", password_hash="hashed", full_name="Admin One")

    service = AdminKeygenService(repo)
    public_key = await service.generate_and_store(str(admin.id))
    assert public_key

    private_key = await service.load_private_key(str(admin.id))
    assert private_key is not None


@pytest.mark.asyncio
async def test_load_private_key_raises_when_not_generated(db_session):
    repo = AdminRepository(db_session)
    admin = await repo.create(email="admin2@example.com", password_hash="hashed", full_name="Admin Two")

    service = AdminKeygenService(repo)
    with pytest.raises(ValueError, match="no signing key set up"):
        await service.load_private_key(str(admin.id))