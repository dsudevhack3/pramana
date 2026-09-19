"""integrity_checker (Flow 4): recomputes hash chain, verifies no link is broken, alerts on tampering."""
from src.config.logging_config import get_logger
from src.core.db.session import db_session_context
from src.core.exceptions.domain_exceptions import HashChainIntegrityError
from src.core.security.crypto.hash_chain import verify_chain_integrity

logger = get_logger("integrity_checker")


async def run_integrity_checker_job() -> None:
    async with db_session_context() as session:
        broken_links = await verify_chain_integrity(session)
        if broken_links:
            logger.error("hash_chain_integrity_violation", broken_record_hashes=broken_links)
            # In production: page on-call, freeze new signing writes, etc.
            raise HashChainIntegrityError(
                f"{len(broken_links)} broken link(s) detected in hash chain: {broken_links}"
            )
        logger.info("hash_chain_integrity_ok")