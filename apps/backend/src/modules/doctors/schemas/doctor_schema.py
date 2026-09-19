from pydantic import BaseModel, EmailStr


class DoctorSignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LicenseVerifyRequest(BaseModel):
    doctor_id: str
    license_number: str
    council_name: str


class SigningKeyRegisterRequest(BaseModel):
    doctor_id: str
    public_key_b64: str


class PlatformRegistrationRequest(BaseModel):
    doctor_id: str


class DoctorProfileResponse(BaseModel):
    id: str
    full_name: str
    license_status: str
    platform_status: str
    organization_id: str | None
    is_suspended: bool

    class Config:
        from_attributes = True