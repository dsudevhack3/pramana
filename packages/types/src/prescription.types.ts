import type { ISODateTime, UUID, Sha256Hex } from './common.types';
import type { TrustTierResult } from './trust-tier.types';

export type PrescriptionState = 'SEALED' | 'CONSUMED' | 'VOIDED' | 'AMENDED';

export interface DrugEntry {
  /** Resolved against the CDSCO / formulary catalogue, never free text. */
  drug_code: string;
  drug_name: string;
  form: string;
  schedule: string;
  strength: string;
  dosage_amount: number;
  dosage_unit: string;
  frequency: string;
  duration_days: number;
  quantity: number;
  is_controlled: boolean;
}

export interface DrugCatalogEntry {
  drug_code: string;
  drug_name: string;
  form: string;
  schedule: string;
  strength: string;
  is_controlled: boolean;
  /** Validated client-side before signing and again server-side. */
  safe_daily_min: number;
  safe_daily_max: number;
  daily_unit: string;
}

export interface PatientBinding {
  name: string;
  phone: string;
  dob: string;
  /** True only once the patient has entered the OTP sent to their phone. */
  otp_verified: boolean;
}

/** The exact object signed client-side. Field order is canonical - do not reorder. */
export interface PrescriptionPayload {
  doctor_id: UUID;
  patient: PatientBinding;
  drugs: DrugEntry[];
  notes: string | null;
  issued_at: ISODateTime;
}

export interface SignPrescriptionRequest {
  payload: PrescriptionPayload;
  /** Base64url Ed25519 detached signature over the canonical JSON payload. */
  signature: string;
  public_key_fingerprint: string;
  /** Generated once per attempt, replayed on retry. See middleware/idempotency.py. */
  idempotency_key: UUID;
}

export interface Prescription {
  id: UUID;
  /** Human-quotable reference, e.g. PRM-4F2A-91C7. */
  reference: string;
  state: PrescriptionState;
  payload: PrescriptionPayload;
  doctor_id: UUID;
  doctor_name: string;

  /** Status stamped at signing time. Never the doctor's live status. */
  doctor_license_status_at_signing: string;
  doctor_platform_status_at_signing: string;
  organization_name_at_signing: string | null;

  signature: string;
  record_hash: Sha256Hex;
  previous_record_hash: Sha256Hex | null;
  chain_height: number;

  token: PrescriptionToken;
  signed_at: ISODateTime;

  /** Present when this record amends an earlier one. */
  amends_prescription_id: UUID | null;
  amended_by_prescription_id: UUID | null;
}

export interface PrescriptionToken {
  token_id: UUID;
  /** Encoded into the QR. Single-use. */
  token_value: string;
  consumed_at: ISODateTime | null;
  consumed_by_pharmacy_id: UUID | null;
  reuse_attempts: number;
}

/** What the verification portal renders after a scan (Flow 3). */
export interface VerificationResult {
  reference: string;
  state: PrescriptionState;
  trust: TrustTierResult;
  doctor_name: string;
  doctor_license_status_at_signing: string;
  signed_at: ISODateTime;
  drugs: DrugEntry[];
  signature_valid: boolean;
  chain_intact: boolean;
  token_already_consumed: boolean;
  /** Populated when the record has been amended; newest first. */
  lineage: Array<{ reference: string; signed_at: ISODateTime; state: PrescriptionState }>;
}

export interface ConsumeTokenResult {
  consumed: boolean;
  consumed_at: ISODateTime;
  /** True when this was a second scan - blocked and flagged. */
  reuse_blocked: boolean;
}
