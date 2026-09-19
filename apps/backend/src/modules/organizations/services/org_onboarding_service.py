from src.core.security.password_hasher import hash_password
from src.modules.organizations.models.organization import OrganizationStatus
from src.modules.organizations.repository import OrganizationAdminRepository, OrganizationRepository
from src.modules.organizations.schemas.organization_schema import OrgSignupRequest
from src.modules.organizations.services.mca_gst_verification_client import McaGstVerificationClient
from src.modules.organizations.services.org_maps_verification_service import OrgMapsVerificationService


class OrgOnboardingService:
    def __init__(
        self, org_repo: OrganizationRepository, admin_repo: OrganizationAdminRepository,
        registry_client: McaGstVerificationClient, maps: OrgMapsVerificationService,
    ) -> None:
        self._org_repo = org_repo
        self._admin_repo = admin_repo
        self._registry_client = registry_client
        self._maps = maps

    async def signup(self, body: OrgSignupRequest):
        registry_ok = await self._registry_client.verify_registration(
            body.registration_number, body.registration_type
        )
        if not registry_ok:
            raise ValueError("Registration number not found in MCA/GST registry")

        address_result = await self._maps.confirm_address(body.address_raw)
        if address_result is None:
            raise ValueError("Could not confirm org address via Google Maps")

        org = await self._org_repo.create(
            name=body.name, registration_number=body.registration_number,
            registration_type=body.registration_type, address_raw=body.address_raw,
            place_id=address_result.place_id, lat=address_result.latitude, lng=address_result.longitude,
        )
        # Status stays PENDING here — first-time orgs always require manual
        # admin review regardless of registry/maps success (fraud-prevention
        # gate, feature_flags.ORG_ONBOARDING_REQUIRES_MANUAL_REVIEW).
        await self._admin_repo.create(
            organization_id=str(org.id), email=body.admin_email,
            password_hash=hash_password(body.admin_password), full_name=body.admin_full_name,
        )
        return org

    async def approve(self, organization_id: str) -> None:
        """Manual review by platform admin — this IS the fraud-prevention gate, distinct from Flow 5 enforcement."""
        await self._org_repo.set_status(organization_id, OrganizationStatus.VERIFIED)

    async def reject(self, organization_id: str) -> None:
        await self._org_repo.set_status(organization_id, OrganizationStatus.REJECTED)