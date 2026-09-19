from pydantic import BaseModel


class ClinicAddressSubmitRequest(BaseModel):
    doctor_id: str
    address_raw: str


class ClinicPhotoSubmitRequest(BaseModel):
    doctor_id: str
    photo_base64: str
    capture_lat: float
    capture_lng: float


class ClinicDocumentSubmitRequest(BaseModel):
    doctor_id: str
    clinical_establishment_reg_number: str


class ClinicVerificationResponse(BaseModel):
    is_verified: bool
    maps_place_id: str
    address_raw: str

    class Config:
        from_attributes = True