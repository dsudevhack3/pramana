import pytest
from unittest.mock import AsyncMock, patch

from src.modules.clinics.services.maps_verification_service import MapsVerificationService


@pytest.mark.asyncio
async def test_confirm_address_returns_none_on_zero_results():
    service = MapsVerificationService()
    with patch.object(service, "_client") as mock_http:
        mock_response = AsyncMock()
        mock_response.json.return_value = {"status": "ZERO_RESULTS", "results": []}
        mock_http.get = AsyncMock(return_value=mock_response)
        result = await service.confirm_address("nonexistent address")
        assert result is None


@pytest.mark.asyncio
async def test_confirm_address_returns_coordinates():
    service = MapsVerificationService()
    with patch.object(service, "_client") as mock_http:
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "status": "OK",
            "results": [{
                "place_id": "abc123", "formatted_address": "123 Main St",
                "geometry": {"location": {"lat": 12.9, "lng": 77.6}},
            }],
        }
        mock_http.get = AsyncMock(return_value=mock_response)
        result = await service.confirm_address("123 Main St")
        assert result.place_id == "abc123"
        assert result.latitude == 12.9