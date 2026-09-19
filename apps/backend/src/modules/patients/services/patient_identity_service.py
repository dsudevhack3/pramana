"""Flow 2's patient identity binding — OTP to patient's phone, distinct from doctor Aadhaar eKYC."""
import secrets

from src.core.security.rate_limiter import check_rate_limit
from src.modules.patients.repository import PatientRepository
from src.modules.patients.schemas.patient_schema import PatientIdentityBindRequest

_otp_store: dict[str, str] = {}  # placeholder — use Redis with TTL in production


class PatientIdentityService:
    def __init__(self, repo: PatientRepository) -> None:
        self._repo = repo

    async def bind_identity(self, body: PatientIdentityBindRequest) -> str:
        patient = await self._repo.get_or_create(body.full_name, body.phone, body.dob)
        await check_rate_limit(f"patient_otp:{body.phone}", limit=5, window_seconds=600)

        otp = f"{secrets.randbelow(999999):06d}"
        _otp_store[str(patient.id)] = otp
        # SMS dispatch via notifications/services/sms_service.py — omitted here
        return str(patient.id)

    async def verify_otp(self, patient_id: str, otp: str) -> bool:
        expected = _otp_store.get(patient_id)
        if expected is None or expected != otp:
            return False
        del _otp_store[patient_id]
        return True