import pytest
from unittest.mock import AsyncMock, patch

from src.core.exceptions.domain_exceptions import DrugValidationError
from src.modules.prescriptions.schemas.prescription_schema import DrugLineInput
from src.modules.prescriptions.services.drug_validation_service import DrugValidationService


@pytest.mark.asyncio
async def test_validate_line_raises_on_unknown_drug():
    service = DrugValidationService()
    with patch.object(service, "_client") as mock_http:
        mock_http.get = AsyncMock(return_value=AsyncMock(status_code=404))
        with pytest.raises(DrugValidationError, match="Unknown drug"):
            await service.validate_line(DrugLineInput(
                drug_name="FakeDrugXYZ", dosage="500mg", quantity=10, frequency="BID", duration_days=5
            ))


@pytest.mark.asyncio
async def test_validate_line_raises_on_dosage_out_of_range():
    service = DrugValidationService()
    with patch.object(service, "_client") as mock_http:
        mock_response = AsyncMock(status_code=200)
        mock_response.json.return_value = {
            "drug_class": "analgesic", "is_controlled_substance": False,
            "safe_dosage_range": {"min": 100, "max": 1000},
        }
        mock_http.get = AsyncMock(return_value=mock_response)
        with pytest.raises(DrugValidationError, match="outside safe range"):
            await service.validate_line(DrugLineInput(
                drug_name="Paracetamol", dosage="5000mg", quantity=10, frequency="BID", duration_days=5
            ))