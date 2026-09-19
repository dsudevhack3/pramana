"""
Step 2: OCR extraction. Uses Tesseract (local, no API key) to pull raw
text off the image, then regex/keyword heuristics to slot text into
fields (doctor name, license number, clinic address, drugs, date,
patient name).

IMPORTANT: this is inherently noisy on handwritten prescriptions.
Every extracted field carries a confidence score — a low-confidence
field should be treated as "unverifiable", never silently dropped or
treated as absent. Swap to Google Cloud Vision API later (add
GOOGLE_VISION_API_KEY to settings) if handwriting accuracy is too weak
for real-world use — the public extract_fields() signature is
provider-agnostic so callers won't need to change.
"""
import re
from dataclasses import dataclass, field

import pytesseract
from PIL import Image

# Rough regex patterns — tune against real sample prescriptions before
# relying on these for anything beyond a hackathon demo.
_LICENSE_PATTERN = re.compile(r"\b(?:Reg(?:istration)?\.?\s*No\.?|Lic(?:ense)?\.?\s*No\.?)[:\s]*([A-Z0-9\-/]{4,20})", re.IGNORECASE)
_DATE_PATTERN = re.compile(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b")
_DR_NAME_PATTERN = re.compile(r"\bDr\.?\s+([A-Z][a-zA-Z.\s]{2,40})", re.IGNORECASE)


@dataclass
class OcrExtractionResult:
    doctor_name: str | None = None
    license_number: str | None = None
    clinic_address: str | None = None
    drug_names: list[str] = field(default_factory=list)
    date: str | None = None
    patient_name: str | None = None
    field_confidence: dict[str, float] = field(default_factory=dict)
    raw_text: str = ""


def _extract_with_confidence(image: Image.Image) -> tuple[str, dict[str, float]]:
    """
    Runs Tesseract with per-word confidence data (image_to_data), then
    reconstructs full text and a rough per-line confidence average —
    used later to flag which extracted fields are trustworthy.
    """
    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    words = data["text"]
    confidences = [float(c) for c in data["conf"] if c not in ("-1", -1)]

    full_text = " ".join(w for w in words if w.strip())
    avg_confidence = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.0

    return full_text, {"_overall": avg_confidence}


def extract_fields(image: Image.Image) -> OcrExtractionResult:
    raw_text, confidence_map = _extract_with_confidence(image)
    overall_confidence = confidence_map["_overall"]

    result = OcrExtractionResult(raw_text=raw_text)

    doctor_match = _DR_NAME_PATTERN.search(raw_text)
    if doctor_match:
        result.doctor_name = doctor_match.group(1).strip()
        result.field_confidence["doctor_name"] = overall_confidence

    license_match = _LICENSE_PATTERN.search(raw_text)
    if license_match:
        result.license_number = license_match.group(1).strip()
        result.field_confidence["license_number"] = overall_confidence

    date_match = _DATE_PATTERN.search(raw_text)
    if date_match:
        result.date = date_match.group(1)
        result.field_confidence["date"] = overall_confidence

    # Drug names and clinic address extraction from free-form OCR text is
    # unreliable without a trained NER model — for the hackathon MVP this
    # is left as a manual-confirm step in the frontend rather than
    # guessed here, to avoid silently inventing drug names that were
    # never actually on the prescription (a genuine patient-safety risk).
    result.field_confidence["drug_names"] = 0.0
    result.field_confidence["clinic_address"] = 0.0
    result.field_confidence["patient_name"] = 0.0

    return result
