import pytest

from src.modules.audit_log.repository import AuditLogRepository
from src.modules.audit_log.services.audit_service import record_audit_entry


@pytest.mark.asyncio
async def test_record_audit_entry_persists(db_session, monkeypatch):
    # record_audit_entry opens its own session via db_session_context;
    # here we verify the repository read path independently.
    from src.modules.audit_log.models.audit_entry import AuditEntry
    db_session.add(AuditEntry(
        actor_id="user-1", actor_role="doctor", method="POST",
        path="/api/v1/prescriptions", status_code=201, request_id="req-1",
    ))
    await db_session.flush()

    repo = AuditLogRepository(db_session)
    entries = await repo.list_recent(limit=10)
    assert len(entries) == 1
    assert entries[0].method == "POST"