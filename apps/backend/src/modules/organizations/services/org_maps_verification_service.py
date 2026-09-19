"""
Thin wrapper delegating to the shared MapsVerificationService — kept as
its own file so organizations/ doesn't import across module boundaries
directly from clinics/ in more than this one place, and so org-specific
address rules (if they ever diverge) have a home.
"""
from src.modules.clinics.services.maps_verification_service import (
    MapsVerificationResult,
    MapsVerificationService,
)


class OrgMapsVerificationService:
    def __init__(self) -> None:
        self._inner = MapsVerificationService()

    async def confirm_address(self, address_raw: str) -> MapsVerificationResult | None:
        return await self._inner.confirm_address(address_raw)