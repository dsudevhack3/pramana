"""
Generic audit logging middleware — writes a row to audit_log for every
mutating request. This is DISTINCT from admin_action (the signed,
hash-chained enforcement ledger): audit_log is best-effort observability,
admin_action is cryptographic provenance. Don't conflate the two.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from src.modules.audit_log.services.audit_service import record_audit_entry

MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class AuditTrailMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.method in MUTATING_METHODS:
            user = getattr(request.state, "user", None)
            await record_audit_entry(
                actor_id=user.sub if user else None,
                actor_role=user.role if user else None,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                request_id=getattr(request.state, "request_id", None),
            )
        return response