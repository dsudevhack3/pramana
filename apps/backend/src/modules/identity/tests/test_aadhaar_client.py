import pytest
from unittest.mock import AsyncMock, patch

from src.core.exceptions.domain_exceptions import AadhaarVerificationFailed
from src.modules.identity.services.aadhaar_client import AadhaarClient, mask_aadhaar


def test_mask_aadhaar():
    assert mask_aadhaar("123456789012") == "XXXX-XXXX-9012"


@pytest.mark.asyncio
async def test_verify_otp_raises_on_failure():
    client = AadhaarClient()
    with patch.object(client, "_client") as mock_http:
        mock_http.post = AsyncMock(return_value=AsyncMock(status_code=400))
        with pytest.raises(AadhaarVerificationFailed):
            await client.verify_otp("ref", "000000")