"""
Runtime feature flags — lets ops toggle behavior without a redeploy.
Backed by env vars for now; swap for a remote flag service later without
changing call sites.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class FeatureFlags(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="FF_", extra="ignore")

    # Flow 0 — org onboarding gated behind manual admin review even on
    # first-time registration (fraud-prevention gate per workflow doc).
    ORG_ONBOARDING_REQUIRES_MANUAL_REVIEW: bool = True

    # Flow 0.5 — pharmacies are lightweight-tier by design: no Aadhaar
    # eKYC, no geotagged photo. This flag exists only so we can tighten
    # it later without a schema change; default MUST stay False.
    PHARMACY_ONBOARDING_REQUIRE_GEOTAGGED_PHOTO: bool = False

    # Flow 4 — individual deterministic checks can be independently
    # disabled (e.g. during a data backfill) without touching the others.
    FLAGGING_ENABLE_DOCTOR_SHOPPING_CHECK: bool = True
    FLAGGING_ENABLE_PHARMACY_CONCENTRATION_CHECK: bool = True
    FLAGGING_ENABLE_SIGNING_PACE_CHECK: bool = True
    FLAGGING_ENABLE_GEO_MISMATCH_CHECK: bool = True

    # Flow 5 — kill switch. If tripped, admin/ still allows viewing the
    # queue but blocks all suspend/flag writes. Emergency use only
    # (e.g. suspected admin account compromise).
    ADMIN_ENFORCEMENT_WRITES_ENABLED: bool = True

    # Belt-and-suspenders: even with the flag on, this double-checks that
    # hash chain writes for admin_action are enabled. If False, enforcement
    # actions are rejected rather than silently written unsigned.
    ADMIN_ACTION_HASH_CHAIN_REQUIRED: bool = True


@lru_cache
def get_feature_flags() -> FeatureFlags:
    return FeatureFlags()