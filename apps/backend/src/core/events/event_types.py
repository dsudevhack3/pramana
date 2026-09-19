"""
Domain events published to the event bus. Notably: DoctorSuspended and
PharmacySuspended are consumed by notifications/ to fire the
account_suspended_alert.html template with the evidence reference,
per Flow 5's appeal-enablement requirement.
"""
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class EventType(StrEnum):
    DOCTOR_APPROVED = "doctor.approved"
    DOCTOR_REJECTED = "doctor.rejected"
    DOCTOR_LICENSE_REVOKED = "doctor.license_revoked"
    DOCTOR_SUSPENDED = "doctor.suspended"                # Flow 5
    PHARMACY_APPROVED = "pharmacy.approved"
    PHARMACY_SUSPENDED = "pharmacy.suspended"            # Flow 5
    PATIENT_FLAGGED = "patient.flagged"                  # Flow 5, soft flag
    PRESCRIPTION_SIGNED = "prescription.signed"
    FLAGGED_CANDIDATE_CREATED = "flagged_candidate.created"  # Flow 4
    ADMIN_ACTION_RECORDED = "admin_action.recorded"      # Flow 5


class DomainEvent(BaseModel):
    event_type: EventType
    occurred_at: datetime
    payload: dict
    correlation_id: str | None = None