from pydantic import BaseModel


class SuspendDoctorRequest(BaseModel):
    doctor_id: str
    evidence_ref: str
    admin_id: str
    reason_note: str | None = None


class SuspendPharmacyRequest(BaseModel):
    pharmacy_id: str
    pharmacist_ids: list[str]   # suspends all pharmacists tied to this pharmacy
    evidence_ref: str
    admin_id: str
    reason_note: str | None = None


class FlagPatientRequest(BaseModel):
    patient_id: str
    evidence_ref: str
    admin_id: str
    rule_reason: str


class DismissCandidateRequest(BaseModel):
    candidate_id: str
    admin_id: str


class AdminActionResponse(BaseModel):
    id: str
    action_type: str
    target_type: str
    target_id: str
    record_hash: str
    evidence_ref: str

    class Config:
        from_attributes = True