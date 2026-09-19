from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.audit_log.models.audit_entry import AuditEntry


class AuditLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_recent(self, limit: int = 100) -> list[AuditEntry]:
        result = await self._session.execute(
            select(AuditEntry).order_by(AuditEntry.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())