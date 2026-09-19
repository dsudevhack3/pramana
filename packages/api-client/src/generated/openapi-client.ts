/**
 * Generated from apps/backend/scripts/generate_openapi.py -> docs/api/openapi.yaml.
 *
 *   pnpm --filter @pramana/api-client generate
 *
 * Do not edit by hand. Until the backend's OpenAPI document is wired into the
 * generator, this file exports only the route table the frontends import, so
 * paths live in one place rather than being retyped across four apps.
 */
export const ROUTES = {
  // identity + doctor onboarding (Flow 1)
  aadhaarStart: '/identity/aadhaar/start',
  aadhaarVerify: '/identity/aadhaar/verify',
  licenseVerify: '/doctors/me/license/verify',
  clinicVerify: '/clinics/verify-address',
  clinicPhoto: '/clinics/photo',
  signingKey: '/doctors/me/signing-key',
  platformRegistration: '/platform-registration/me',
  doctorMe: '/doctors/me',
  doctorOnboardingProgress: '/doctors/me/onboarding',

  // prescriptions (Flow 2)
  drugSearch: '/prescriptions/drugs',
  patientOtpStart: '/prescriptions/patient/otp/start',
  patientOtpVerify: '/prescriptions/patient/otp/verify',
  patientRiskCheck: '/prescriptions/patient-risk-check',
  prescriptionSign: '/prescriptions',
  prescriptionList: '/prescriptions',

  // verification + dispensing (Flow 3)
  verify: '/verification/lookup',
  consume: '/verification/consume',

  // prescription photo verification
  photoVerification: '/photo-verification/verify',

  // pharmacies (Flow 0.5)
  pharmacyOnboard: '/pharmacies/onboard',
  pharmacistLogin: '/auth/pharmacist/login',
  pharmacistMe: '/pharmacies/me',

  // organisations (Flow 0)
  orgOnboard: '/organizations/onboard',
  orgMe: '/organizations/me',
  orgRoster: '/organizations/me/roster',
  orgInvites: '/organizations/me/invites',
  orgAnalytics: '/organizations/me/analytics',

  // flagging (Flow 4, read-only)
  flaggedQueue: '/flagging/candidates',

  // admin enforcement (Flow 5)
  adminDoctorReviews: '/admin/doctors',
  adminPharmacyReviews: '/admin/pharmacies',
  adminActions: '/admin/actions',
  adminLedger: '/admin/actions/ledger',
  adminChainIntegrity: '/admin/actions/integrity',
  adminKey: '/admin/me/signing-key',
  patientFlags: '/admin/patient-flags',
  auditLog: '/audit/entries',
} as const;

export type RouteName = keyof typeof ROUTES;
