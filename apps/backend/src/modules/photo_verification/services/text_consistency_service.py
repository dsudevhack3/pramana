from __future__ import annotations

from dataclasses import dataclass
from difflib import SequenceMatcher
import re
from typing import Any


@dataclass(frozen=True)
class TextConsistencyResult:
    score: float
    status: str
    flags: list[str]

    @property
    def issues(self) -> list[str]:
        """
        Backward-compatible alias for older callers.
        """
        return self.flags


class TextConsistencyService:
    """
    Conservative OCR/text consistency checks.

    This is not an LLM.
    It validates relationships between extracted prescription fields.

    The service can accept either:
        1. Individual OCR fields, or
        2. An OCR extraction result object.
    """

    @staticmethod
    def _normalize(value: str | None) -> str:
        if not value:
            return ""

        value = value.lower().strip()

        value = re.sub(
            r"\s+",
            " ",
            value,
        )

        return value

    @classmethod
    def compare_text(
        cls,
        first: str | None,
        second: str | None,
    ) -> float:

        first = cls._normalize(first)
        second = cls._normalize(second)

        if not first or not second:
            return 0.0

        return SequenceMatcher(
            None,
            first,
            second,
        ).ratio()

    @staticmethod
    def _get_field(
        source: Any,
        field_name: str,
        default: Any = None,
    ) -> Any:
        """
        Safely extract a field from either a Pydantic/model object
        or a dictionary.
        """

        if source is None:
            return default

        if isinstance(source, dict):
            return source.get(
                field_name,
                default,
            )

        return getattr(
            source,
            field_name,
            default,
        )

    @classmethod
    def analyze(
        cls,
        ocr_result: Any = None,
        doctor_name: str | None = None,
        license_number: str | None = None,
        clinic_address: str | None = None,
        patient_name: str | None = None,
        date: str | None = None,
        drug_names: list[str] | None = None,
    ) -> TextConsistencyResult:

        # -----------------------------------------------------
        # Support the route calling analyze(ocr_result)
        # -----------------------------------------------------

        if ocr_result is not None and not isinstance(
            ocr_result,
            str,
        ):
            doctor_name = cls._get_field(
                ocr_result,
                "doctor_name",
                doctor_name,
            )

            license_number = cls._get_field(
                ocr_result,
                "license_number",
                license_number,
            )

            clinic_address = cls._get_field(
                ocr_result,
                "clinic_address",
                clinic_address,
            )

            patient_name = cls._get_field(
                ocr_result,
                "patient_name",
                patient_name,
            )

            date = cls._get_field(
                ocr_result,
                "date",
                date,
            )

            drug_names = cls._get_field(
                ocr_result,
                "drug_names",
                drug_names,
            )

        issues: list[str] = []

        # -----------------------------------------------------
        # FIELD PRESENCE
        # -----------------------------------------------------

        fields = {
            "doctor_name": doctor_name,
            "license_number": license_number,
            "clinic_address": clinic_address,
            "patient_name": patient_name,
            "date": date,
        }

        present_fields = sum(
            1
            for value in fields.values()
            if value
        )

        total_fields = len(fields)

        extraction_score = (
            present_fields / total_fields
            if total_fields
            else 0.0
        )

        # -----------------------------------------------------
        # MEDICINE EXTRACTION
        # -----------------------------------------------------

        drugs = drug_names or []

        if not drugs:
            issues.append(
                "No medicine names confidently extracted"
            )

        # -----------------------------------------------------
        # LICENSE STRUCTURE
        # -----------------------------------------------------

        if license_number:

            normalized_license = re.sub(
                r"[^A-Za-z0-9]",
                "",
                license_number,
            )

            if len(normalized_license) < 4:
                issues.append(
                    "License number appears unusually short"
                )

        # -----------------------------------------------------
        # DATE STRUCTURE
        # -----------------------------------------------------

        if date:

            date_digits = re.sub(
                r"\D",
                "",
                date,
            )

            if len(date_digits) < 6:
                issues.append(
                    "Prescription date has low structural confidence"
                )

        # -----------------------------------------------------
        # DOCTOR / LICENSE BASIC CONSISTENCY
        # -----------------------------------------------------

        if doctor_name and len(
            cls._normalize(doctor_name)
        ) < 3:

            issues.append(
                "Doctor name has very little readable text"
            )

        # -----------------------------------------------------
        # CLINIC ADDRESS BASIC CONSISTENCY
        # -----------------------------------------------------

        if clinic_address and len(
            cls._normalize(clinic_address)
        ) < 5:

            issues.append(
                "Clinic address has very little readable text"
            )

        # -----------------------------------------------------
        # PATIENT NAME BASIC CONSISTENCY
        # -----------------------------------------------------

        if patient_name and len(
            cls._normalize(patient_name)
        ) < 2:

            issues.append(
                "Patient name has very little readable text"
            )

        # -----------------------------------------------------
        # DRUG NAME SANITY CHECK
        # -----------------------------------------------------

        valid_drugs = []

        for drug in drugs:

            if not drug:
                continue

            normalized_drug = cls._normalize(
                drug
            )

            if len(normalized_drug) >= 2:
                valid_drugs.append(
                    normalized_drug
                )

        if drugs and not valid_drugs:
            issues.append(
                "Extracted medicine names have low text quality"
            )

        # -----------------------------------------------------
        # SCORE
        # -----------------------------------------------------

        score = extraction_score

        if valid_drugs:
            score += 0.10

        # Penalize structural issues conservatively.
        structural_penalty = min(
            0.30,
            len(issues) * 0.05,
        )

        score -= structural_penalty

        score = max(
            0.0,
            min(
                1.0,
                score,
            ),
        )

        # -----------------------------------------------------
        # STATUS
        # -----------------------------------------------------

        if score >= 0.75:
            status = "CONSISTENT"

        elif score >= 0.50:
            status = "PARTIAL"

        else:
            status = "LOW_CONFIDENCE"

        return TextConsistencyResult(
            score=round(score, 4),
            status=status,
            flags=issues,
        )