import { ROUTES } from '@pramana/api-client';
import type { Pharmacist, Pharmacy, PharmacyOnboardingRequest } from '@pramana/types';
import { api } from './client';
import { setAccessToken } from './client';

/** Flow 0.5. Registration plus admin approval - deliberately lighter than Flow 1. */
export function onboardPharmacy(input: PharmacyOnboardingRequest) {
  return api.post<Pharmacy>(ROUTES.pharmacyOnboard, input, { anonymous: true });
}

export function verifyPharmacyAddress(input: { address_text: string }) {
  return api.post<{ maps_confirmed: boolean; formatted_address: string | null; place_id: string | null }>(
    '/pharmacies/verify-address',
    input,
    { anonymous: true },
  );
}

export async function signIn(input: { email: string; password: string }) {
  const result = await api.post<{ access_token: string; pharmacist: Pharmacist }>(
    ROUTES.pharmacistLogin,
    input,
    { anonymous: true },
  );
  setAccessToken(result.access_token);
  return result.pharmacist;
}

export function getMe() {
  return api.get<Pharmacist & { pharmacy: Pharmacy | null }>(ROUTES.pharmacistMe);
}

export interface SuspensionDetail {
  action_id: string;
  reason: string;
  cites_rule: string;
  admin_name: string;
  created_at: string;
  record_hash: string;
  appeal_url: string;
}

export function getSuspensionDetail() {
  return api.get<SuspensionDetail>('/pharmacies/me/suspension');
}
