from pydantic import BaseModel, EmailStr


class AdminSignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class AdminProfileResponse(BaseModel):
    id: str
    full_name: str
    has_signing_key: bool

    class Config:
        from_attributes = True