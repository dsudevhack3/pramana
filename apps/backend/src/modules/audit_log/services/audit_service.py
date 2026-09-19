from src.core.db.session import db_session_context
from src.modules.audit_log.models.audit_entry import AuditEntry


async def record_audit_entry(
    actor_id: str | None, actor_role: str | None, method: str,
    path: str, status_code: int, request_id: str | None,
) -> None:
    async with db_session_context() as session:
        session.add(AuditEntry(
            actor_id=actor_id, actor_role=actor_role, method=method,
            path=path, status_code=status_code, request_id=request_id,
        ))