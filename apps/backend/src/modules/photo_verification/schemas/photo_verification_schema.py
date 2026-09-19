from pydantic import BaseModel, Field


class PhotoVerificationRequest(BaseModel):
    """Metadata accompanying the uploaded image (the image itself comes via multipart file)."""

    notes: str | None = Field(
        None,
        max_length=500,
        description="Optional context from the uploader",
    )


class ImageQualityResult(BaseModel):
    passed: bool
    issues: list[str] = Field(default_factory=list)


class OcrExtractionResult(BaseModel):
    doctor_name: str | None = None
    license_number: str | None = None
    clinic_address: str | None = None
    drug_names: list[str] = Field(default_factory=list)
    date: str | None = None
    patient_name: str | None = None
    field_confidence: dict[str, float] = Field(default_factory=dict)


class ForensicAnalysisResult(BaseModel):
    flags: list[str] = Field(default_factory=list)
    ela_anomaly_score: float | None = None

    metadata_flags: list[str] = Field(default_factory=list)
    timestamp_flags: list[str] = Field(default_factory=list)
    dimension_flags: list[str] = Field(default_factory=list)
    manipulation_flags: list[str] = Field(default_factory=list)
    layout_flags: list[str] = Field(default_factory=list)

    forensic_score: float = 0.0


class AITamperingResult(BaseModel):
    """Result produced by the local image-forgery detection model."""

    model_config = {
        "protected_namespaces": ()
    }

    probability: float | None = None
    prediction: str | None = None
    model_name: str | None = None
    model_available: bool = False
    error: str | None = None


class TextConsistencyResult(BaseModel):
    """Heuristic consistency analysis of OCR-extracted prescription text."""

    score: float = 1.0
    status: str = "UNKNOWN"
    flags: list[str] = Field(default_factory=list)


class LayoutConsistencyResult(BaseModel):
    """Heuristic visual/layout consistency analysis."""

    score: float = 1.0
    status: str = "UNKNOWN"
    flags: list[str] = Field(default_factory=list)


class PhotoVerificationResponse(BaseModel):
    id: str

    verification_case: str

    matched_prescription_id: str | None = None

    # --- OCR ---
    ocr_result: OcrExtractionResult

    # --- Traditional forensic analysis ---
    forensic_result: ForensicAnalysisResult | None = None

    # --- AI tampering detection ---
    ai_tampering_result: AITamperingResult | None = None

    # --- External verification ---
    license_check_passed: bool | None = None
    clinic_check_passed: bool | None = None
    drug_check_passed: bool | None = None

    # --- Text consistency ---
    text_consistency_result: TextConsistencyResult | None = None

    # --- Layout consistency ---
    layout_consistency_result: LayoutConsistencyResult | None = None

    # --- Final risk assessment ---
    risk_level: str
    risk_reasons: list[str]

    review_status: str

    model_config = {
        "from_attributes": True
    }