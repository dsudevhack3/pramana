import pytest

from src.modules.flagging.services.geo_mismatch_check import _haversine_m, run_geo_mismatch_check


def test_haversine_zero_distance():
    assert _haversine_m(12.9, 77.6, 12.9, 77.6) == 0


def test_haversine_known_distance_approx():
    # Bengaluru to Chennai is roughly 290km
    distance = _haversine_m(12.9716, 77.5946, 13.0827, 80.2707)
    assert 280_000 < distance < 300_000


@pytest.mark.asyncio
async def test_no_candidates_without_signing_location_metadata(db_session):
    candidates = await run_geo_mismatch_check(db_session)
    assert candidates == []