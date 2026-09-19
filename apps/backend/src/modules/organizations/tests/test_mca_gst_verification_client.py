import pytest
from unittest.mock import AsyncMock, patch

from src.modules.organizations.services.mca_gst_verification_client import McaGstVerificationClient


@pytest.mark.asyncio
async def test_verify_registration_true_on_200():
    client = McaGstVerificationClient()
    with patch.object(client, "_client") as mock_http:
        mock_http.get = AsyncMock(return_value=AsyncMock(status_code=200))
        assert await client.verify_registration("GST123", "GST") is True


@pytest.mark.asyncio
async def test_verify_registration_false_on_404():
    client = McaGstVerificationClient()
    with patch.object(client, "_client") as mock_http:
        mock_http.get = AsyncMock(return_value=AsyncMock(status_code=404))
        assert await client.verify_registration("BAD", "GST") is False