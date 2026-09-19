"""
Central application settings, loaded from environment variables.
Uses pydantic-settings so config is validated at startup, not discovered
at runtime via random os.environ.get() calls scattered through the code.
"""
from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Core app ---
    APP_NAME: str = "prescription-provenance-backend"
    ENV: Literal["dev", "staging", "prod"] = "dev"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # --- Database ---
    DATABASE_URL: PostgresDsn
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # DB role used by the app must NOT have UPDATE/DELETE on prescriptions
    # or admin_action tables — enforced at the Postgres role level, not here.
    # This flag just lets startup checks assert the expected role name.
    DB_APP_ROLE_NAME: str = "app_insert_only"

    # --- Auth / JWT ---
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Signing / crypto ---
    # Ed25519 keys are generated client-side (doctors, admins); the server
    # never holds a private key. This is just the algorithm tag stored
    # alongside public keys for forward-compatibility if that ever changes.
    SIGNING_ALGORITHM: Literal["ed25519"] = "ed25519"
    HASH_CHAIN_ALGO: Literal["sha256"] = "sha256"

    # --- External: Aadhaar eKYC (Flow 1, Step 1) ---
    AADHAAR_PROVIDER: Literal["setu", "surepass"] = "setu"
    AADHAAR_PROVIDER_BASE_URL: str
    AADHAAR_PROVIDER_API_KEY: str
    AADHAAR_OTP_TIMEOUT_SECONDS: int = 300

    # --- External: Medical council registry (Flow 1, Step 2 + revocation_watcher) ---
    MEDICAL_REGISTRY_BASE_URL: str
    MEDICAL_REGISTRY_API_KEY: str
    LICENSE_NAME_DOB_FUZZY_MATCH_THRESHOLD: float = 0.85

    # --- External: MCA/GST registry (Flow 0, org onboarding) ---
    MCA_GST_REGISTRY_BASE_URL: str
    MCA_GST_REGISTRY_API_KEY: str

    # --- External: Pharmacy council registry (Flow 0.5) ---
    PHARMACY_COUNCIL_REGISTRY_BASE_URL: str
    PHARMACY_COUNCIL_REGISTRY_API_KEY: str

    # --- External: Google Maps (Flow 1 Step 3, Flow 0, Flow 0.5) ---
    GOOGLE_MAPS_API_KEY: str

    # --- External: Drug/formulary DB (Flow 2) ---
    CDSCO_FORMULARY_BASE_URL: str
    CDSCO_FORMULARY_API_KEY: str

    # --- AI / Prescription Photo Verification ---
    # Local Hugging Face model is downloaded lazily on first verification.
    # No paid inference API is required.
    AI_FORGERY_MODEL_REPO: str = "salmanzaman777/image-forgery-m3"
    AI_FORGERY_MODEL_FILENAME: str = "M3_best.keras"
    AI_FORGERY_MODEL_REVISION: str = "v1"

    # Model threshold documented by the M3 model card.
    # >= threshold => possible image tampering.
    AI_FORGERY_THRESHOLD: float = 0.50

    # Input size expected by the M3 model.
    AI_FORGERY_IMAGE_SIZE: int = 224

    # --- Photo verification thresholds ---
    PHOTO_MIN_WIDTH: int = 800
    PHOTO_MIN_HEIGHT: int = 600
    PHOTO_MAX_WIDTH: int = 10000
    PHOTO_MAX_HEIGHT: int = 10000

    # --- flagging_engine (Flow 4) thresholds — deterministic, tunable ---
    FLAG_DOCTOR_SHOPPING_WINDOW_DAYS: int = 30
    FLAG_DOCTOR_SHOPPING_MIN_DOCTORS: int = 2
    FLAG_PHARMACY_CONCENTRATION_PCT_THRESHOLD: float = 0.60
    FLAG_SIGNING_PACE_MAX_SCRIPTS_PER_HOUR: int = 12
    FLAG_GEO_MISMATCH_RADIUS_METERS: int = 2000

    # --- Rate limiting ---
    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_OTP_ENDPOINTS: str = "5/minute"

    # --- Notifications ---
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMS_PROVIDER_API_KEY: str = ""

    @field_validator("ENV")
    @classmethod
    def validate_env_matches_debug(cls, v: str) -> str:
        return v


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — avoids re-parsing env on every import."""
    return Settings()