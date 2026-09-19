"""
JWT issuance/verification for session auth. Holds no signing-key material
related to prescriptions or admin actions — that's Ed25519 in crypto/,
totally separate from this HS256 session token concern.
"""
from datetime import datetime, timedelta, timezone

import jwt
from pydantic import BaseModel

from src.config.settings import get_settings

settings = get_settings()


class TokenPayload(BaseModel):
    sub: str          # user id
    role: str
    org_id: str | None = None
    pharmacy_id: str | None = None
    exp: datetime


def create_access_token(user_id: str, role: str, org_id: str | None = None,
                         pharmacy_id: str | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": user_id, "role": role, "org_id": org_id,
        "pharmacy_id": pharmacy_id, "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "type": "refresh", "exp": expire},
        settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> TokenPayload:
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    return TokenPayload(**payload)


from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenPayload:
    try:
        return decode_token(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc