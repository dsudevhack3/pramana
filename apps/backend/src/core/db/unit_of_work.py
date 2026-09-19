"""
Unit of Work pattern — wraps a set of repository operations in a single
transaction. Used anywhere a request touches more than one table and both
writes must succeed or both must roll back (e.g. signing_orchestrator
writing a prescription row AND advancing the hash chain pointer).
"""
from types import TracebackType
from typing import Self

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db.session import AsyncSessionLocal


class UnitOfWork:
    def __init__(self) -> None:
        self._session: AsyncSession | None = None

    @property
    def session(self) -> AsyncSession:
        if self._session is None:
            raise RuntimeError("UnitOfWork used outside of 'async with' block")
        return self._session

    async def __aenter__(self) -> Self:
        self._session = AsyncSessionLocal()
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        assert self._session is not None
        if exc_type is not None:
            await self._session.rollback()
        await self._session.close()

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()