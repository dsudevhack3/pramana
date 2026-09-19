from pydantic import BaseModel


class RegistrationOptInRequest(BaseModel):
    doctor_id: str


class RegistrationApprovalRequest(BaseModel):
    doctor_id: str


class RegistrationStatusResponse(BaseModel):
    doctor_id: str
    status: str

    class Config:
        from_attributes = True