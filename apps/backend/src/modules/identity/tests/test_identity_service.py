from unittest.mock import AsyncMock

import pytest

from src.modules.identity.repository import IdentityRepository
from src.modules.identity.services.identity_service import IdentityService


@pytest.mark.asyncio
async def test_verify_and_store_masks_aadhaar(db_session, sample_doctor):
    client = AsyncMock()
    client.verify_otp.return_value = {
        "name": "Test Doctor", "dob": "1990-01-01", "aadhaar_number": "123456789012",
    }
    service = IdentityService(IdentityRepository(db_session), client)

    result = await service.verify_and_store(str(sample_doctor.id), "ref-token", "123456")

    assert result.masked_aadhaar == "XXXX-XXXX-9012"
    assert "123456789012" not in result.masked_aadhaar