from pydantic import BaseModel


class PatientIdentityBindRequest(BaseModel):
    full_name: str
    phone: str
    dob: str


class PatientOtpVerifyRequest(BaseModel):
    patient_id: str
    otp: str


class PatientFlagResponse(BaseModel):
    id: str
    patient_id: str
    rule_reason: str
    evidence_ref: str
    is_active: bool

    class Config:
        from_attributes = True


class PatientResponse(BaseModel):
    id: str
    full_name: str
    phone: str

    class Config:
        from_attributes = True