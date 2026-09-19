import type { ISODate, ISODateTime, UUID, Address } from './common.types';

/** Flow 1 step 2 outcome from the medical council registry match. */
export type LicenseMatchResult = 'exact' | 'partial' | 'none';

/** Government-side verification, derived from the council registry. */
export type GovtVerificationStatus =
  | 'UNVERIFIED'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REVOKED';

/**
 * Flow 1 step 5. Deliberately independent of GovtVerificationStatus:
 * a doctor can be govt-verified but NOT platform-registered, in which case
 * their prescriptions carry no in-system provenance record (trust tier 3).
 */
export type PlatformRegistrationStatus =
  | 'NOT_REGISTERED'
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED';

export interface AadhaarVerification {
  /** Only the masked value is ever stored or returned. */
  masked_aadhaar: string;
  provider_reference_token: string;
  name: string;
  dob: ISODate;
  consent_recorded_at: ISODateTime;
}

export interface LicenseVerification {
  license_number: string;
  council_name: string;
  registrant_name: string;
  registrant_dob: ISODate;
  match_result: LicenseMatchResult;
  /** 0-1. Surfaced to the admin reviewer on a partial match. */
  match_confidence: number;
  verified_at: ISODateTime | null;
}

export interface ClinicVerification {
  clinic_id: UUID;
  address: Address;
  maps_place_id: string | null;
  maps_confirmed: boolean;
  establishment_cert_number: string | null;
  establishment_cert_confirmed: boolean;
  /** Live in-app capture only. Gallery uploads are rejected server-side. */
  geotagged_photo_url: string | null;
  photo_distance_metres: number | null;
  last_reverified_at: ISODateTime | null;
}

export interface SigningKey {
  /** Base64url raw Ed25519 public key. The private half never leaves the device. */
  public_key: string;
  /** Human-comparable fingerprint, rendered in mono. */
  fingerprint: string;
  created_at: ISODateTime;
  revoked_at: ISODateTime | null;
}

export interface Doctor {
  id: UUID;
  name: string;
  email: string;
  phone: string;
  govt_status: GovtVerificationStatus;
  platform_status: PlatformRegistrationStatus;
  /** Null when solo. Affiliation is a display layer, never part of the trust root. */
  organization_id: UUID | null;
  organization_name: string | null;
  aadhaar: AadhaarVerification | null;
  license: LicenseVerification | null;
  clinic: ClinicVerification | null;
  signing_key: SigningKey | null;
  is_suspended: boolean;
  /** Set when is_suspended; links to the exact signed admin_action for appeal. */
  suspension_action_id: UUID | null;
  created_at: ISODateTime;
}

/** Which of the six Flow 1 steps the doctor has completed. */
export interface OnboardingProgress {
  aadhaar: boolean;
  license: boolean;
  clinic: boolean;
  signing_key: boolean;
  platform_registration: boolean;
  org_affiliation: boolean;
}

export interface LicenseStatusHistoryEntry {
  id: UUID;
  status: GovtVerificationStatus;
  source: 'registry_poll' | 'manual_review' | 'onboarding';
  observed_at: ISODateTime;
  note: string | null;
}
