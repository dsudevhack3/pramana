import pytest

from src.modules.flagging.services.doctor_shopping_check import run_doctor_shopping_check


@pytest.mark.asyncio
async def test_no_candidates_when_no_data(db_session):
    candidates = await run_doctor_shopping_check(db_session)
    assert candidates == []

# Full positive-case test requires seeding prescriptions + line items across
# 2+ doctors for the same patient/drug class within the window — see
# scripts/seed_dev_data.py for fixture data reused in integration tests.