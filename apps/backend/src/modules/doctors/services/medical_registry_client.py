import httpx

from src.config.settings import get_settings

settings = get_settings()


class MedicalRegistryClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.MEDICAL_REGISTRY_BASE_URL,
            headers={"Authorization": f"Bearer {settings.MEDICAL_REGISTRY_API_KEY}"},
            timeout=15.0,
        )

    async def lookup(self, license_number: str, council_name: str) -> dict | None:
        resp = await self._client.get(
            "/v1/registry/lookup", params={"license_number": license_number, "council": council_name}
        )
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()  # {"name": ..., "dob": ..., "status": "active"|"revoked"}

    async def check_status(self, license_number: str, council_name: str) -> str:
        """Used by revocation_watcher — returns current status string only."""
        data = await self.lookup(license_number, council_name)
        return data["status"] if data else "unknown"