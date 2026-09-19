"""
Flow 4 background job. Polls the medical council registry per doctor and
blocks new prescriptions on revocation. Historical prescriptions are
untouched because they stamped license_status permanently at signing time
(see prescriptions/services/signing_orchestrator.py).

Reused by admin/services/enforcement_service.py for the DOCTOR suspend
path — both flows land on the exact same `block_doctor()` mechanism, per
the workflow doc's explicit note.
"""
from src.config.logging_config import get_logger
from src.core.events.event_bus import event_bus
from src.core.events.event_types import DomainEvent, EventType
from src.modules.doctors.models.doctor import DoctorLicenseStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.doctors.services.medical_registry_client import MedicalRegistryClient

logger = get_logger("revocation_watcher")


class RevocationWatcher:
    def __init__(self, repo: DoctorRepository, registry_client: MedicalRegistryClient) -> None:
        self._repo = repo
        self._registry_client = registry_client

    async def run_for_all_active_doctors(self) -> None:
        doctors = await self._repo.list_active_doctors()
        for doctor in doctors:
            current_status = await self._registry_client.check_status(
                doctor.license_number, doctor.council_name
            )
            if current_status == "revoked" and doctor.license_status != DoctorLicenseStatus.REVOKED:
                await self.block_doctor(doctor.id, source="revocation_watcher")

    async def block_doctor(self, doctor_id: str, source: str) -> None:
        """
        Shared block mechanism. `source` distinguishes a government
        revocation from an admin Flow-5 suspension in license_status_history,
        even though both flip the same is_suspended-equivalent gate on the
        signing path.
        """
        await self._repo.update_license_status(
            doctor_id, license_number=None, council_name=None,
            new_status=DoctorLicenseStatus.REVOKED, source=source,
        )
        from datetime import datetime, timezone
        await event_bus.publish(DomainEvent(
            event_type=EventType.DOCTOR_LICENSE_REVOKED,
            occurred_at=datetime.now(timezone.utc),
            payload={"doctor_id": doctor_id, "source": source},
        ))
        logger.info("doctor_blocked", doctor_id=doctor_id, source=source)