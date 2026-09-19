"""Seeds a local dev DB with a realistic slice of every entity type for manual testing."""
import asyncio

from src.core.db.session import db_session_context
from src.core.security.crypto.keygen import generate_keypair
from src.core.security.password_hasher import hash_password
from src.modules.doctors.models.doctor import DoctorLicenseStatus, PlatformRegistrationStatus
from src.modules.doctors.repository import DoctorRepository
from src.modules.organizations.repository import OrganizationRepository
from src.modules.patients.repository import PatientRepository
from src.modules.pharmacies.models.pharmacy import PharmacyStatus
from src.modules.pharmacies.repository import PharmacistRepository, PharmacyRepository


async def seed() -> None:
    async with db_session_context() as session:
        org_repo = OrganizationRepository(session)
        org = await org_repo.create(
            name="Apollo City Hospital", registration_number="CIN00012345",
            registration_type="CIN", address_raw="1 Hospital Rd, Bengaluru",
            place_id="seed-place-org", lat=12.9716, lng=77.5946,
        )
        await org_repo.set_status(str(org.id), org.status.__class__.VERIFIED)

        doctor_repo = DoctorRepository(session)
        doctor = await doctor_repo.create(
            email="dr.seed@example.com", password_hash=hash_password("devpassword123"),
            full_name="Dr. Seed Sharma",
        )
        keypair = generate_keypair()
        await doctor_repo.set_signing_public_key(str(doctor.id), keypair.public_key_b64)
        await doctor_repo.update_license_status(
            str(doctor.id), "KMC12345", "Karnataka Medical Council",
            DoctorLicenseStatus.AUTO_APPROVED, source="seed_script",
        )
        await doctor_repo.set_platform_status(str(doctor.id), PlatformRegistrationStatus.ACTIVE)
        await doctor_repo.set_organization(str(doctor.id), str(org.id))

        pharmacy_repo = PharmacyRepository(session)
        pharmacy = await pharmacy_repo.create(
            name="Seed City Pharmacy", license_number="PHKA0099",
            state_council_name="Karnataka Pharmacy Council",
            address_raw="22 MG Road, Bengaluru", place_id="seed-place-pharmacy",
            lat=12.9750, lng=77.6050,
        )
        await pharmacy_repo.set_status(str(pharmacy.id), PharmacyStatus.APPROVED)

        pharmacist_repo = PharmacistRepository(session)
        await pharmacist_repo.create(
            email="pharmacist.seed@example.com", password_hash=hash_password("devpassword123"),
            full_name="Seed Pharmacist", pharmacy_id=str(pharmacy.id),
        )

        patient_repo = PatientRepository(session)
        await patient_repo.get_or_create("Seed Patient", "+919812345678", "1990-06-15")

        print(f"Seeded doctor {doctor.id}, pharmacy {pharmacy.id}, org {org.id}")


if __name__ == "__main__":
    asyncio.run(seed())