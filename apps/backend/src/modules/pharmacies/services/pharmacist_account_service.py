from src.core.security.password_hasher import hash_password
from src.modules.pharmacies.models.pharmacy import PharmacyStatus
from src.modules.pharmacies.repository import PharmacistRepository, PharmacyRepository
from src.modules.pharmacies.schemas.pharmacist_schema import PharmacistSignupRequest


class PharmacistAccountService:
    def __init__(self, pharmacist_repo: PharmacistRepository, pharmacy_repo: PharmacyRepository) -> None:
        self._pharmacist_repo = pharmacist_repo
        self._pharmacy_repo = pharmacy_repo

    async def create_pharmacist(self, body: PharmacistSignupRequest):
        pharmacy = await self._pharmacy_repo.get_by_id(body.pharmacy_id)
        if pharmacy is None or pharmacy.status != PharmacyStatus.APPROVED:
            raise ValueError("Pharmacy must be APPROVED before a pharmacist login can be tied to it")

        return await self._pharmacist_repo.create(
            email=body.email, password_hash=hash_password(body.password),
            full_name=body.full_name, pharmacy_id=body.pharmacy_id,
        )

    async def can_scan_and_consume(self, pharmacist_id: str) -> bool:
        """Called by verification/api/routes.py before allowing a scan-and-consume action (Flow 3)."""
        pharmacist = await self._pharmacist_repo.get_by_id(pharmacist_id)
        if pharmacist is None or pharmacist.is_suspended:
            return False
        if pharmacist.pharmacy_id is None:
            return False
        pharmacy = await self._pharmacy_repo.get_by_id(pharmacist.pharmacy_id)
        return pharmacy is not None and pharmacy.status == PharmacyStatus.APPROVED