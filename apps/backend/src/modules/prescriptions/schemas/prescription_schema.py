from pydantic import BaseModel, Field


class DrugLineInput(BaseModel):
    drug_name: str
    dosage: str
    quantity: int = Field(gt=0)
    frequency: str
    duration_days: int = Field(gt=0)


class PrescriptionCreateRequest(BaseModel):
    doctor_id: str
    patient_id: str
    drug_lines: list[DrugLineInput]
    idempotency_key: str
    canonical_payload_b64: str   # exact bytes the doctor's browser signed
    signature_b64: str            # Ed25519 signature over canonical_payload_b64


class PrescriptionAmendRequest(BaseModel):
    original_prescription_id: str
    doctor_id: str
    reason: str
    drug_lines: list[DrugLineInput]
    idempotency_key: str
    canonical_payload_b64: str
    signature_b64: str


class PrescriptionResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    status: str
    token: str
    record_hash: str
    doctor_license_status_at_signing: str

    class Config:
        from_attributes = True


class PatientRiskWarning(BaseModel):
    has_warning: bool
    message: str | None = None
    evidence_ref: str | None = None