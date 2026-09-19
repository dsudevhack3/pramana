import asyncio
from sqlalchemy import text
from src.core.db.session import db_session_context
async def main():
    async with db_session_context() as s:
        r = await s.execute(text("select table_name, column_name, data_type from information_schema.columns where table_name in ('pharmacies','pharmacists') order by table_name, ordinal_position"))
        for row in r: print(row)
asyncio.run(main())
