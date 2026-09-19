from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import get_db_session
from src.core.security.rbac import require_admin
from src.modules.audit_log.repository import AuditLogRepository

router = APIRouter(dependencies=[Depends(require_admin)])


@router.get("")
async def list_audit_entries(limit: int = 100, session: AsyncSession = Depends(get_db_session)):
    repo = AuditLogRepository(session)
    entries = await repo.list_recent(limit)
    return [
        {
            "id": str(e.id), "actor_id": e.actor_id, "actor_role": e.actor_role,
            "method": e.method, "path": e.path, "status_code": e.status_code,
            "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]