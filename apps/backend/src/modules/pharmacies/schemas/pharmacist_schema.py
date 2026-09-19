from pydantic import BaseModel, EmailStr


class PharmacistSignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    pharmacy_id: str


class PharmacistResponse(BaseModel):
    id: str
    full_name: str
    pharmacy_id: str | None
    is_suspended: bool

    class Config:
        from_attributes = True