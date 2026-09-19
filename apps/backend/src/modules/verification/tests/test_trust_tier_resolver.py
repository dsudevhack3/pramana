from unittest.mock import MagicMock

from src.modules.verification.services.trust_tier_resolver import resolve_trust_tier


def _fake_prescription(license_status, platform_status, org_id):
    p = MagicMock()
    p.doctor_license_status_at_signing = license_status
    p.doctor_platform_status_at_signing = platform_status
    p.doctor_org_id_at_signing = org_id
    return p


def test_fully_verified_hospital_affiliated():
    result = resolve_trust_tier(_fake_prescription("auto_approved", "active", "org-1"))
    assert result.tier_label == "Fully Verified, Hospital-Affiliated"


def test_fully_verified_independent():
    result = resolve_trust_tier(_fake_prescription("auto_approved", "active", None))
    assert result.tier_label == "Fully Verified, Independent Practice"


def test_govt_only_lower_trust_badge():
    result = resolve_trust_tier(_fake_prescription("auto_approved", "not_registered", None))
    assert result.tier_label == "Doctor Verified, No Platform Provenance"


def test_reads_frozen_status_not_live():
    """Even if a mock 'live' status differs, the resolver only ever reads the frozen at-signing fields."""
    result = resolve_trust_tier(_fake_prescription("auto_approved", "active", "org-1"))
    assert result.govt_verified is True