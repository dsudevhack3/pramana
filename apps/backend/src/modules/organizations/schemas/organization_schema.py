from pydantic import BaseModel, EmailStr


class OrgSignupRequest(BaseModel):
    name: str
    registration_number: str
    registration_type: str
    address_raw: str
    admin_email: EmailStr
    admin_password: str
    admin_full_name: str


class OrgApprovalRequest(BaseModel):
    organization_id: str


class InviteDoctorRequest(BaseModel):
    organization_id: str
    doctor_email: EmailStr


class InviteAcceptRequest(BaseModel):
    invite_token: str
    doctor_id: str


class OrganizationResponse(BaseModel):
    id: str
    name: str
    status: str
    address_raw: str

    class Config:
        from_attributes = True