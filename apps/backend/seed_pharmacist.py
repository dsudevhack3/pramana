import asyncio, uuid
from sqlalchemy import text
from src.core.db.session import db_session_context
from src.core.security.password_hasher import hash_password
from src.core.security.jwt import create_access_token
from src.core.security.rbac import Role

EMAIL = "pharmacist.seed@example.com"

async def main():
    async with db_session_context() as s:
        r = await s.execute(text("select id, pharmacy_id from pharmacists where email=:e"), {"e": EMAIL})
        row = r.first()
        if row:
            pid, phid = str(row[0]), str(row[1])
        else:
            phid, pid = str(uuid.uuid4()), str(uuid.uuid4())
            await s.execute(text("""insert into pharmacies
              (id,name,license_number,state_council_name,address_raw,latitude,longitude,maps_place_id,status,created_at,updated_at)
              values (:id,'Seed City Pharmacy','PHKA0099','Karnataka Pharmacy Council','22 MG Road, Bengaluru',12.9750,77.6050,'seed-place-pharmacy','approved',now(),now())"""),
              {"id": phid})
            await s.execute(text("""insert into pharmacists
              (id,email,password_hash,full_name,pharmacy_id,is_suspended,created_at,updated_at)
              values (:id,:e,:h,'Seed Pharmacist',:ph,false,now(),now())"""),
              {"id": pid, "e": EMAIL, "h": hash_password("devpassword123"), "ph": phid})
            await s.commit()
    print(create_access_token(pid, Role.PHARMACIST.value, None, phid))

asyncio.run(main())
