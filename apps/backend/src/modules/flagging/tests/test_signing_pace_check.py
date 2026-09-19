import pytest

from src.modules.flagging.services.signing_pace_check import run_signing_pace_check


@pytest.mark.asyncio
async def test_no_candidates_below_threshold(db_session):
    candidates = await run_signing_pace_check(db_session)
    assert candidates == []