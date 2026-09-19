import pytest

from src.modules.flagging.services.pharmacy_concentration_check import run_pharmacy_concentration_check


@pytest.mark.asyncio
async def test_no_candidates_with_no_consumptions(db_session):
    candidates = await run_pharmacy_concentration_check(db_session)
    assert candidates == []