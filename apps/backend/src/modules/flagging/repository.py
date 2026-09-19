from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.flagging.models.flagged_candidate import CandidateStatus, FlaggedCandidate, TargetType


class FlaggingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, rule_name: str, target_type: TargetType, target_id: str, evidence: dict) -> FlaggedCandidate:
        candidate = FlaggedCandidate(
            rule_name=rule_name, target_type=target_type, target_id=target_id, evidence=evidence
        )
        self._session.add(candidate)
        await self._session.flush()
        return candidate

    async def list_open(self) -> list[FlaggedCandidate]:
        result = await self._session.execute(
            select(FlaggedCandidate)
            .where(FlaggedCandidate.status == CandidateStatus.OPEN)
            .order_by(FlaggedCandidate.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, candidate_id: str) -> FlaggedCandidate | None:
        result = await self._session.execute(select(FlaggedCandidate).where(FlaggedCandidate.id == candidate_id))
        return result.scalar_one_or_none()

    async def set_status(self, candidate_id: str, status: CandidateStatus) -> None:
        candidate = await self.get_by_id(candidate_id)
        if candidate is None:
            raise ValueError(f"Flagged candidate {candidate_id} not found")
        candidate.status = status
        await self._session.flush()