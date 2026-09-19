import pytest
from unittest.mock import AsyncMock

from src.core.exceptions.domain_exceptions import PrescriptionVoidedError
from src.modules.prescriptions.models.prescription import PrescriptionStatus
from src.modules.prescriptions.repository import AmendmentRepository, PrescriptionRepository
from src.modules.prescriptions.services.amendment_service import AmendmentService


@pytest.mark.asyncio
async def test_amend_raises_on_voided_original(db_session):
    repo = PrescriptionRepository(db_session)
    service = AmendmentService(repo, AmendmentRepository(db_session), AsyncMock())

    # Simulate an existing voided prescription via repo internals would
    # require a full fixture; here we assert the guard directly.
    original = AsyncMock(status=PrescriptionStatus.VOIDED)
    repo.get_by_id = AsyncMock(return_value=original)

    with pytest.raises(PrescriptionVoidedError):
        await service.amend(AsyncMock(original_prescription_id="some-id"))