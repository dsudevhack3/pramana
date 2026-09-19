"""
Async SQLAlchemy engine/session setup.

IMPORTANT: the DB role configured here (settings.DB_APP_ROLE_NAME) must
have INSERT/SELECT only on append-only tables (prescriptions,
prescription_amendment, admin_action) — no UPDATE, no DELETE. That
constraint is enforced by a Postgres GRANT, not by this code, but
`assert_insert_only_role()` gives us a fast-fail sanity check at startup
so a misconfigured environment doesn't silently allow mutation.
"""
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.config.settings import get_settings

settings = get_settings()

engine = create_async_engine(
    str(settings.DATABASE_URL),
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — one session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def db_session_context() -> AsyncGenerator[AsyncSession, None]:
    """For use outside request scope — workers, scripts."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def assert_insert_only_role(session: AsyncSession) -> None:
    """
    Startup sanity check. Confirms the connected role cannot UPDATE the
    prescriptions table at the DB level — belt-and-suspenders for the
    "DB insert only" guarantee described in Flow 2.
    """
    result = await session.execute(
        text(
            """
            SELECT privilege_type FROM information_schema.role_table_grants
            WHERE table_name = 'prescriptions'
              AND grantee = current_user
              AND privilege_type = 'UPDATE'
            """
        )
    )
    if result.first() is not None:
        raise RuntimeError(
            "FATAL: current DB role has UPDATE grant on prescriptions table. "
            "This violates the append-only provenance guarantee. Fix the "
            "Postgres GRANTs before starting the app."
        )