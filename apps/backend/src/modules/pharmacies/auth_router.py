from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from src.core.db.session import db_session_context
from src.core.security.jwt import TokenPayload, create_access_token, get_current_user
from src.core.security.rbac import Role

router = APIRouter(tags=["pharmacist-auth"])
_ph = PasswordHasher()


class LoginBody(BaseModel):
    email: str
    password: str


def _public(row: dict) -> dict:
    return {k: v for k, v in row.items() if k != "password_hash"}


@router.post("/auth/pharmacist/login")
async def pharmacist_login(body: LoginBody):
    async with db_session_context() as s:
        r = await s.execute(
            text("select p.*, ph.name as pharmacy_name from pharmacists p left join pharmacies ph on ph.id = p.pharmacy_id where lower(p.email) = lower(:e)"),
            {"e": body.email.strip()},
        )
        row = r.mappings().first()
    bad = HTTPException(status_code=401, detail="Invalid email or password")
    if row is None:
        raise bad
    try:
        _ph.verify(row["password_hash"], body.password)
    except (VerifyMismatchError, InvalidHashError):
        raise bad
    token = create_access_token(
        str(row["id"]), Role.PHARMACIST.value, None, str(row["pharmacy_id"])
    )
    return {"access_token": token, "pharmacist": _public(dict(row))}


@router.get("/pharmacies/me")
async def pharmacist_me(user: TokenPayload = Depends(get_current_user)):
    async with db_session_context() as s:
        r = await s.execute(text("select * from pharmacists where id = :i"), {"i": user.sub})
        row = r.mappings().first()
        if row is None:
            raise HTTPException(status_code=401, detail="Unknown pharmacist")
        p = await s.execute(text("select * from pharmacies where id = :i"), {"i": row["pharmacy_id"]})
        pharmacy = p.mappings().first()
    return {**_public(dict(row)), "pharmacy_name": pharmacy["name"] if pharmacy else None, "pharmacy": dict(pharmacy) if pharmacy else None}

