from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.identity.models.identity_record import IdentityRecord


class IdentityRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self, doctor_id: str, masked_aadhaar: str, provider_reference_token: str,
        verified_name: str, verified_dob: str,
    ) -> IdentityRecord:
        record = IdentityRecord(
            doctor_id=doctor_id,
            masked_aadhaar=masked_aadhaar,
            provider_reference_token=provider_reference_token,
            provider_name="setu",
            verified_name=verified_name,
            verified_dob=verified_dob,
            consent_given_at=datetime.now(timezone.utc).isoformat(),
        )
        self._session.add(record)
        await self._session.flush()
        return record

    async def get_by_doctor_id(self, doctor_id: str) -> IdentityRecord | None:
        result = await self._session.execute(
            select(IdentityRecord).where(IdentityRecord.doctor_id == doctor_id)
        )
        return result.scalar_one_or_none()