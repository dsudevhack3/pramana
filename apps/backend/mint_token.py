import asyncio
from sqlalchemy import text
from src.core.db.session import db_session_context
from src.core.security.jwt import create_access_token

async def main():
    async with db_session_context() as s:
        r = await s.execute(text("select id from doctors where email='dr.seed@example.com'"))
        did = r.scalar_one()
    print(create_access_token(str(did), "doctor"))

asyncio.run(main())
