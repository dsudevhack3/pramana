from src.core.security.password_hasher import hash_password
from src.modules.doctors.models.doctor import DoctorLicenseStatus, PlatformRegistrationStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.doctors.schemas.doctor_schema import DoctorSignupRequest
from src.modules.doctors.services.license_matcher import MatchOutcome, match_identity
from src.modules.doctors.services.medical_registry_client import MedicalRegistryClient
from src.modules.identity.repository import IdentityRepository


class OnboardingService:
    def __init__(
        self, repo: DoctorRepository, identity_repo: IdentityRepository,
        registry_client: MedicalRegistryClient,
    ) -> None:
        self._repo = repo
        self._identity_repo = identity_repo
        self._registry_client = registry_client

    async def signup(self, body: DoctorSignupRequest):
        return await self._repo.create(
            email=body.email, password_hash=hash_password(body.password), full_name=body.full_name
        )

    async def verify_license(self, doctor_id: str, license_number: str, council_name: str) -> str:
        identity = await self._identity_repo.get_by_doctor_id(doctor_id)
        if identity is None:
            raise ValueError("Doctor must complete Aadhaar eKYC (Step 1) before license verification")

        registry_data = await self._registry_client.lookup(license_number, council_name)
        if registry_data is None:
            outcome = MatchOutcome.REJECTED
        else:
            outcome = match_identity(
                identity.verified_name, identity.verified_dob,
                registry_data["name"], registry_data["dob"],
            )

        status_map = {
            MatchOutcome.AUTO_APPROVED: DoctorLicenseStatus.AUTO_APPROVED,
            MatchOutcome.MANUAL_REVIEW: DoctorLicenseStatus.MANUAL_REVIEW,
            MatchOutcome.REJECTED: DoctorLicenseStatus.REJECTED,
        }
        await self._repo.update_license_status(
            doctor_id, license_number, council_name, status_map[outcome], source="license_matcher"
        )
        return outcome

    async def register_signing_key(self, doctor_id: str, public_key_b64: str) -> None:
        await self._repo.set_signing_public_key(doctor_id, public_key_b64)

    async def opt_into_platform(self, doctor_id: str) -> None:
        await self._repo.set_platform_status(doctor_id, PlatformRegistrationStatus.PENDING)

    async def approve_platform_registration(self, doctor_id: str) -> None:
        """Admin action — separate from Flow 5 enforcement; this is onboarding approval, not moderation."""
        await self._repo.set_platform_status(doctor_id, PlatformRegistrationStatus.ACTIVE)