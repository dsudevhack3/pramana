import httpx

from src.config.settings import get_settings

settings = get_settings()


class McaGstVerificationClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.MCA_GST_REGISTRY_BASE_URL,
            headers={"Authorization": f"Bearer {settings.MCA_GST_REGISTRY_API_KEY}"},
            timeout=15.0,
        )

    async def verify_registration(self, registration_number: str, registration_type: str) -> bool:
        resp = await self._client.get(
            "/v1/registry/lookup",
            params={"number": registration_number, "type": registration_type},
        )
        return resp.status_code == 200