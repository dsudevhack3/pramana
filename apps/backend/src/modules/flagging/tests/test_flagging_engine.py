import pytest

from src.modules.flagging.repository import FlaggingRepository
from src.modules.flagging.services.flagging_engine import FlaggingEngine


@pytest.mark.asyncio
async def test_run_all_checks_returns_zero_on_empty_db(db_session):
    engine = FlaggingEngine(FlaggingRepository(db_session), db_session)
    created_count = await engine.run_all_checks()
    assert created_count == 0
    # Confirms flagging_engine never raises when there's simply nothing to flag,
    # and critically never calls any suspend/ban code path — it has none.