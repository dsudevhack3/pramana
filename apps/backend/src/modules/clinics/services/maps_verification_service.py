"""
Google Maps address confirmation. Reused as-is by organizations/ (Flow 0
org address) and pharmacies/ (Flow 0.5 pharmacy address) — same pattern,
per the workflow doc's explicit note in both flows.
"""
import httpx

from src.config.settings import get_settings

settings = get_settings()


class MapsVerificationResult:
    def __init__(self, place_id: str, latitude: float, longitude: float, formatted_address: str):
        self.place_id = place_id
        self.latitude = latitude
        self.longitude = longitude
        self.formatted_address = formatted_address


class MapsVerificationService:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url="https://maps.googleapis.com/maps/api", timeout=10.0
        )

    async def confirm_address(self, address_raw: str) -> MapsVerificationResult | None:
        resp = await self._client.get(
            "/geocode/json",
            params={"address": address_raw, "key": settings.GOOGLE_MAPS_API_KEY},
        )
        resp.raise_for_status()
        data = resp.json()
        if data["status"] != "OK" or not data["results"]:
            return None

        result = data["results"][0]
        location = result["geometry"]["location"]
        return MapsVerificationResult(
            place_id=result["place_id"],
            latitude=location["lat"],
            longitude=location["lng"],
            formatted_address=result["formatted_address"],
        )