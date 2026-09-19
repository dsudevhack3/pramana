from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.logging_config import configure_logging
from src.config.settings import get_settings
from src.core.middleware.audit_trail import AuditTrailMiddleware
from src.core.middleware.error_handler import register_error_handlers
from src.core.middleware.idempotency import IdempotencyMiddleware
from src.core.middleware.request_logging import RequestLoggingMiddleware

from src.modules.identity.api.routes import router as identity_router
from src.modules.doctors.api.routes import router as doctors_router
from src.modules.clinics.api.routes import router as clinics_router
from src.modules.pharmacies.api.routes import router as pharmacies_router
from src.modules.organizations.api.routes import router as organizations_router
from src.modules.platform_registration.api.routes import router as platform_registration_router
from src.modules.prescriptions.api.routes import router as prescriptions_router
from src.modules.verification.api.routes import router as verification_router
from src.modules.patients.api.routes import router as patients_router
from src.modules.admin.api.routes import router as admin_router
from src.modules.audit_log.api.routes import router as audit_log_router
from src.modules.photo_verification.api.routes import router as photo_verification_router


def create_app() -> FastAPI:
    configure_logging()
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(AuditTrailMiddleware)
    app.add_middleware(IdempotencyMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    register_error_handlers(app)

    prefix = settings.API_V1_PREFIX

    app.include_router(
        identity_router,
        prefix=f"{prefix}/identity",
        tags=["identity"],
    )

    app.include_router(
        doctors_router,
        prefix=f"{prefix}/doctors",
        tags=["doctors"],
    )

    app.include_router(
        clinics_router,
        prefix=f"{prefix}/clinics",
        tags=["clinics"],
    )

    app.include_router(
        pharmacies_router,
        prefix=f"{prefix}/pharmacies",
        tags=["pharmacies"],
    )

    app.include_router(
        organizations_router,
        prefix=f"{prefix}/organizations",
        tags=["organizations"],
    )

    app.include_router(
        platform_registration_router,
        prefix=f"{prefix}/platform-registration",
        tags=["platform"],
    )

    app.include_router(
        prescriptions_router,
        prefix=f"{prefix}/prescriptions",
        tags=["prescriptions"],
    )

    app.include_router(
        verification_router,
        prefix=f"{prefix}/verification",
        tags=["verification"],
    )

    app.include_router(
        patients_router,
        prefix=f"{prefix}/patients",
        tags=["patients"],
    )

    app.include_router(
        admin_router,
        prefix=f"{prefix}/admin",
        tags=["admin"],
    )

    app.include_router(
        audit_log_router,
        prefix=f"{prefix}/audit-log",
        tags=["audit"],
    )

    app.include_router(
        photo_verification_router,
        prefix=f"{prefix}/photo-verification",
        tags=["photo-verification"],
    )

    from src.modules.pharmacies.auth_router import router as pharmacist_auth_router

    app.include_router(pharmacist_auth_router, prefix="/api/v1")

    return app
