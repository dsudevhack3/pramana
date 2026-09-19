import type { ISODateTime, UUID, Address } from './common.types';

/**
 * Flow 0.5. Deliberately lighter than doctor onboarding: pharmacists consume
 * trust records rather than create them, so the bar is registration plus admin
 * approval - no Aadhaar eKYC, no geotagged photo.
 */
export type PharmacyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface Pharmacy {
  id: UUID;
  name: string;
  license_number: string;
  council_name: string;
  address: Address;
  maps_confirmed: boolean;
  maps_place_id: string | null;
  status: PharmacyStatus;
  approved_at: ISODateTime | null;
  /** Set when SUSPENDED; links to the signed admin_action carrying the reason. */
  suspension_action_id: UUID | null;
  created_at: ISODateTime;
}

export interface Pharmacist {
  id: UUID;
  name: string;
  email: string;
  phone: string;
  /** Null only in the window between signup and pharmacy approval. */
  pharmacy_id: UUID | null;
  pharmacy_name: string | null;
  is_suspended: boolean;
  suspension_action_id: UUID | null;
}

export interface PharmacyOnboardingRequest {
  pharmacy_name: string;
  license_number: string;
  council_name: string;
  address: Address;
  pharmacist_name: string;
  pharmacist_email: string;
  pharmacist_phone: string;
}
