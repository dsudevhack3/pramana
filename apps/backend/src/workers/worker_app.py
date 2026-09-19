"""Entry point for the background worker process (separate from the API server)."""
import asyncio

from src.config.logging_config import configure_logging, get_logger
from src.workers.clinic_reverify_job import run_clinic_reverify_job
from src.workers.flagging_engine_job import run_flagging_engine_job
from src.workers.license_recheck_job import run_license_recheck_job

logger = get_logger("worker_app")


async def scheduler_loop() -> None:
    while True:
        try:
            await run_license_recheck_job()
        except Exception:
            logger.exception("license_recheck_job_failed")
        try:
            await run_clinic_reverify_job()
        except Exception:
            logger.exception("clinic_reverify_job_failed")
        try:
            await run_flagging_engine_job()
        except Exception:
            logger.exception("flagging_engine_job_failed")

        await asyncio.sleep(3600)  # hourly tick; real deployment uses a proper scheduler (Celery beat / cron)


if __name__ == "__main__":
    configure_logging()
    asyncio.run(scheduler_loop())