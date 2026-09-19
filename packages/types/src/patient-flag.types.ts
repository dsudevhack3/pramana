import type { ISODateTime, UUID } from './common.types';
import type { FlaggingRule } from './flagged-candidate.types';

/**
 * Flow 5, patient branch. NOT a ban - there is no suspend control for patients
 * anywhere in the product, by design. This mirrors real-world PDMP behaviour:
 * you cannot lock a patient out of healthcare. The flag surfaces as advisory
 * context to a prescriber at the moment of writing, and the doctor still decides.
 */
export interface PatientFlag {
  id: UUID;
  patient_name: string;
  patient_phone_masked: string;
  rule: FlaggingRule;
  /** One sentence a prescriber can act on without opening anything. */
  detail: string;
  raised_at: ISODateTime;
  expires_at: ISODateTime | null;
  raised_by_action_id: UUID;
}

/**
 * Read-only response consumed by <PatientRiskWarningBanner /> during Flow 2.
 * Advisory only - it never blocks the sign action.
 */
export interface PatientRiskCheckResult {
  has_flags: boolean;
  flags: PatientFlag[];
  checked_at: ISODateTime;
}
