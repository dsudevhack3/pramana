"""
NEW — periodic job that calls modules/flagging/services/flagging_engine.py.
Writes candidates only; strictly separate from admin/, which is the only
piece that acts on what it finds.
"""
from src.config.logging_config import get_logger
from src.core.db.session import db_session_context
from src.modules.flagging.repository import FlaggingRepository
from src.modules.flagging.services.flagging_engine import FlaggingEngine

logger = get_logger("flagging_engine_job")


async def run_flagging_engine_job() -> None:
    async with db_session_context() as session:
        engine = FlaggingEngine(FlaggingRepository(session), session)
        created_count = await engine.run_all_checks()
        logger.info("flagging_engine_run_complete", candidates_created=created_count)