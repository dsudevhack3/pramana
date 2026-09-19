"""
Flow 2's typo-proof drug entry + dosage safety check. Autocomplete against
CDSCO/formulary DB and validates dosage against known safe range.
"""
import httpx

from src.config.settings import get_settings
from src.core.exceptions.domain_exceptions import DrugValidationError
from src.modules.prescriptions.schemas.prescription_schema import DrugLineInput

settings = get_settings()


class DrugValidationService:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.CDSCO_FORMULARY_BASE_URL,
            headers={"Authorization": f"Bearer {settings.CDSCO_FORMULARY_API_KEY}"},
            timeout=10.0,
        )

    async def autocomplete(self, query: str) -> list[dict]:
        resp = await self._client.get("/v1/drugs/autocomplete", params={"q": query})
        resp.raise_for_status()
        return resp.json()["results"]

    async def validate_line(self, line: DrugLineInput) -> dict:
        """
        Returns enriched drug metadata (class, is_controlled_substance)
        used both to populate prescription_line_item rows and to feed
        flagging_engine's doctor-shopping / drug-class checks.
        """
        resp = await self._client.get("/v1/drugs/lookup", params={"name": line.drug_name})
        if resp.status_code == 404:
            raise DrugValidationError(f"Unknown drug: {line.drug_name}")
        drug = resp.json()

        safe_range = drug.get("safe_dosage_range")
        if safe_range and not self._dosage_within_range(line.dosage, safe_range):
            raise DrugValidationError(
                f"Dosage '{line.dosage}' for {line.drug_name} is outside safe range {safe_range}"
            )

        return {
            "drug_class": drug.get("drug_class"),
            "is_controlled_substance": drug.get("is_controlled_substance", False),
        }

    def _dosage_within_range(self, dosage: str, safe_range: dict) -> bool:
        # Simplified numeric-extraction check; real implementation parses
        # units (mg/ml/etc) and compares against safe_range["min"]/["max"].
        import re
        match = re.search(r"[\d.]+", dosage)
        if not match:
            return False
        value = float(match.group())
        return safe_range["min"] <= value <= safe_range["max"]