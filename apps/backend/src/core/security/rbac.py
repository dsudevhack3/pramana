"""
Role-based access control. The single source of truth for "admin-exclusive"
scope — Flow 5 endpoints MUST depend on require_role("admin") and nothing
else should be able to satisfy that dependency.
"""
from enum import StrEnum

from fastapi import Depends, HTTPException, status

from src.core.security.jwt import get_current_user, TokenPayload


class Role(StrEnum):
    DOCTOR = "doctor"
    ORG_ADMIN = "org_admin"
    PHARMACIST = "pharmacist"
    ADMIN = "admin"          # platform admin — the only role that can hit Flow 5
    PATIENT = "patient"


def require_role(*allowed: Role):
    def _dependency(user: TokenPayload = Depends(get_current_user)) -> TokenPayload:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {[r.value for r in allowed]}",
            )
        return user
    return _dependency


# Convenience dependency used on every admin/api/routes.py endpoint.
require_admin = require_role(Role.ADMIN)

# Org-admins can invite doctors (Flow 0) but must NEVER satisfy require_admin —
# org affiliation is a display layer, not a trust/authority escalation.
require_org_admin = require_role(Role.ORG_ADMIN)

require_pharmacist = require_role(Role.PHARMACIST)
require_doctor = require_role(Role.DOCTOR)