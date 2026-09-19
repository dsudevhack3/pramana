import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from src.config.settings import get_settings
from src.core.db.base import Base

# Import every model module so Base.metadata is fully populated for autogenerate.
from src.modules.identity.models import identity_record  # noqa
from src.modules.doctors.models import doctor, license_status_history  # noqa
from src.modules.clinics.models import clinic  # noqa
from src.modules.pharmacies.models import pharmacy, pharmacist  # noqa
from src.modules.organizations.models import organization, organization_admin, organization_invite  # noqa
from src.modules.platform_registration.models import platform_registration  # noqa
from src.modules.prescriptions.models import prescription, prescription_line_item, prescription_amendment  # noqa
from src.modules.verification.models import token_consumption  # noqa
from src.modules.patients.models import patient, patient_flag  # noqa
from src.modules.flagging.models import flagged_candidate  # noqa
from src.modules.admin.repository import Admin  # noqa
from src.modules.admin.models import admin_action  # noqa
from src.modules.audit_log.models import audit_entry  # noqa

config = context.config
fileConfig(config.config_file_name)
target_metadata = Base.metadata

settings = get_settings()
config.set_main_option("sqlalchemy.url", str(settings.DATABASE_URL))


def run_migrations_offline() -> None:
    context.configure(url=str(settings.DATABASE_URL), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = create_async_engine(str(settings.DATABASE_URL))
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())