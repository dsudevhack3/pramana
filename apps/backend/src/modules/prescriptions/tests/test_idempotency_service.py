import pytest

from src.modules.prescriptions.services.idempotency_service import get_cached_response


@pytest.mark.asyncio
async def test_get_cached_response_returns_none_when_missing():
    result = await get_cached_response("idem:nonexistent-key", "fingerprint")
    assert result is None