from src.core.exceptions.base_exceptions import AppError, ConflictError, ForbiddenError, NotFoundError


# --- Identity / doctors ---
class AadhaarVerificationFailed(AppError):
    status_code = 422
    default_detail = "Aadhaar eKYC verification failed"


class LicenseMatchFailed(AppError):
    status_code = 422
    default_detail = "Medical license name/DOB does not match Aadhaar record"


class DoctorNotVerifiedError(ForbiddenError):
    default_detail = "Doctor has not completed onboarding verification"


class DoctorSuspendedError(ForbiddenError):
    default_detail = "Doctor is suspended and cannot sign new prescriptions"


class DoctorLicenseRevokedError(ForbiddenError):
    default_detail = "Doctor's medical license has been revoked"


# --- Pharmacies (Flow 0.5) ---
class PharmacyNotApprovedError(ForbiddenError):
    default_detail = "Pharmacy has not been approved by admin"


class PharmacistSuspendedError(ForbiddenError):
    default_detail = "Pharmacist account is suspended and cannot consume tokens"


# --- Prescriptions (Flow 2) ---
class InvalidSignatureError(AppError):
    status_code = 422
    default_detail = "Prescription signature does not verify against doctor's public key"


class DuplicateIdempotencyKeyError(ConflictError):
    default_detail = "This idempotency key has already been processed"


class DrugValidationError(AppError):
    status_code = 422
    default_detail = "Drug/dosage failed validation against formulary"


# --- Verification / dispensing (Flow 3) ---
class TokenAlreadyConsumedError(ConflictError):
    default_detail = "This prescription token has already been consumed"


class PrescriptionVoidedError(ForbiddenError):
    default_detail = "This prescription version has been voided/amended; see latest version"


# --- Hash chain integrity ---
class HashChainIntegrityError(AppError):
    status_code = 500
    default_detail = "Hash chain integrity check failed — possible tampering"


# --- Admin / enforcement (Flow 5) ---
class EnforcementWritesDisabledError(ForbiddenError):
    default_detail = "Admin enforcement writes are currently disabled (kill switch active)"


class InvalidTargetTypeError(AppError):
    status_code = 422
    default_detail = "Enforcement action target_type must be doctor, pharmacy, or patient"


class FlaggedCandidateNotFoundError(NotFoundError):
    default_detail = "Flagged candidate not found"