import { ROUTES, newIdempotencyKey } from '@pramana/api-client';
import type {
  ClinicVerification,
  Doctor,
  LicenseVerification,
  OnboardingProgress,
  OrganizationInvite,
  SigningKey,
} from '@pramana/types';
import { api } from './client';

/* ---- Flow 1 step 1: Aadhaar eKYC ------------------------------------------
   Consent is captured as its own call so the timestamp the backend stores is
   the moment the doctor agreed, not the moment the OTP happened to arrive. */

export interface AadhaarStartResponse {
  transaction_id: string;
  /** Masked destination, e.g. "XXXXXX8812", so the doctor can tell it is theirs. */
  otp_sent_to: string;
}

export function startAadhaarVerification(input: { aadhaar_number: string; consent: true }) {
  return api.post<AadhaarStartResponse>(ROUTES.aadhaarStart, input);
}

export function verifyAadhaarOtp(input: { transaction_id: string; otp: string }) {
  return api.post<Doctor>(ROUTES.aadhaarVerify, input, { idempotencyKey: newIdempotencyKey() });
}

/* ---- Flow 1 step 2: medical licence --------------------------------------- */

export function verifyLicense(input: { license_number: string; council_code: string }) {
  return api.post<LicenseVerification>(ROUTES.licenseVerify, input);
}

export function listCouncils() {
  return api.get<Array<{ code: string; name: string }>>('/doctors/councils');
}

/* ---- Flow 1 step 3: clinic ------------------------------------------------- */

export function verifyClinicAddress(input: { address_text: string }) {
  return api.post<{ maps_confirmed: boolean; place_id: string | null; formatted_address: string | null; lat: number; lng: number }>(
    ROUTES.clinicVerify,
    input,
  );
}

export function submitClinicCertificate(input: { establishment_cert_number: string; place_id: string }) {
  return api.post<ClinicVerification>('/clinics/certificate', input);
}

/**
 * Live in-app capture only. The backend rejects anything without EXIF-free
 * capture metadata from our own camera path, so a gallery upload cannot pass -
 * the file is sent as a blob with the capture coordinates recorded separately.
 */
export function uploadClinicPhoto(input: { blob: Blob; lat: number; lng: number; captured_at: string }) {
  const form = new FormData();
  form.append('photo', input.blob, 'clinic.jpg');
  form.append('lat', String(input.lat));
  form.append('lng', String(input.lng));
  form.append('captured_at', input.captured_at);
  // FormData bypasses the JSON client deliberately; it is still routed through
  // this module so the app has exactly one network surface.
  return api.post<ClinicVerification>(ROUTES.clinicPhoto, form as unknown as undefined);
}

/* ---- Flow 1 step 4: signing key -------------------------------------------- */

export function registerPublicKey(input: { public_key: string; fingerprint: string; proof_signature: string }) {
  return api.post<SigningKey>(ROUTES.signingKey, input, { idempotencyKey: newIdempotencyKey() });
}

/* ---- Flow 1 steps 5 and 6 -------------------------------------------------- */

export function requestPlatformRegistration() {
  return api.post<Doctor>(ROUTES.platformRegistration, {});
}

export function getMe() {
  return api.get<Doctor>(ROUTES.doctorMe);
}

export function getOnboardingProgress() {
  return api.get<OnboardingProgress>(ROUTES.doctorOnboardingProgress);
}

export function listMyInvites() {
  return api.get<OrganizationInvite[]>('/doctors/me/invites');
}

export function respondToInvite(inviteId: string, accept: boolean) {
  return api.post<OrganizationInvite>(`/doctors/me/invites/${inviteId}`, { accept });
}

export function leaveOrganization() {
  return api.del<Doctor>('/doctors/me/organization');
}

/* ---- Suspension (Flow 5 consequence, read-only here) ----------------------- */

export interface SuspensionNotice {
  action_id: string;
  reason: string;
  cites_rule: string;
  cites_candidate_reference: string | null;
  admin_name: string;
  created_at: string;
  record_hash: string;
  appeal_url: string;
}

export function getSuspensionNotice() {
  return api.get<SuspensionNotice>('/doctors/me/suspension');
}
