"""revocation_watcher (Flow 4): polls medical council registry for license status changes."""
from src.core.db.session import db_session_context
from src.modules.doctors.repository import DoctorRepository
from src.modules.doctors.services.medical_registry_client import MedicalRegistryClient
from src.modules.doctors.services.revocation_watcher import RevocationWatcher


async def run_license_recheck_job() -> None:
    async with db_session_context() as session:
        watcher = RevocationWatcher(DoctorRepository(session), MedicalRegistryClient())
        await watcher.run_for_all_active_doctors()