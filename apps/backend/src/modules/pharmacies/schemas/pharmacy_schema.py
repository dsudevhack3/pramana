from pydantic import BaseModel


class PharmacySignupRequest(BaseModel):
    name: str
    license_number: str
    state_council_name: str
    address_raw: str


class PharmacyApprovalRequest(BaseModel):
    pharmacy_id: str


class PharmacyResponse(BaseModel):
    id: str
    name: str
    status: str
    address_raw: str

    class Config:
        from_attributes = True