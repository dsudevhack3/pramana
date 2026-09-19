import type { ISODateTime, UUID, Sha256Hex } from './common.types';
import type { FlaggedActorType } from './flagged-candidate.types';

/**
 * Flow 5. Every enforcement decision is made by a human, signed with the
 * admin's own Ed25519 key, and appended to the SAME hash chain as
 * prescriptions - so platform governance is auditable rather than a black box.
 */
export type AdminActionType =
  | 'SUSPEND_DOCTOR'
  | 'SUSPEND_PHARMACY'
  | 'SUSPEND_PHARMACIST'
  | 'SOFT_FLAG_PATIENT'
  | 'DISMISS_FLAG'
  | 'ESCALATE_FLAG'
  | 'APPROVE_DOCTOR'
  | 'REJECT_DOCTOR'
  | 'APPROVE_PHARMACY'
  | 'REJECT_PHARMACY'
  | 'LIFT_SUSPENSION';

export interface AdminAction {
  id: UUID;
  sequence: number;
  action: AdminActionType;
  target_type: FlaggedActorType | 'organization';
  target_id: UUID;
  target_name: string;
  /** The candidate whose evidence this action cites. Null for onboarding reviews. */
  flagged_candidate_id: UUID | null;
  flagged_candidate_reference: string | null;
  /** Free text the admin typed. Shown verbatim to the account holder. */
  reason: string;
  admin_id: UUID;
  admin_name: string;
  signature: string;
  record_hash: Sha256Hex;
  previous_record_hash: Sha256Hex;
  chain_height: number;
  created_at: ISODateTime;
}

export interface CreateAdminActionRequest {
  action: AdminActionType;
  target_type: FlaggedActorType | 'organization';
  target_id: UUID;
  flagged_candidate_id?: UUID | null;
  /** Never empty. The Modal's destructive variant enforces this before submit. */
  reason: string;
  signature: string;
  idempotency_key: UUID;
}

/** Result of recomputing the admin section of the shared chain. */
export interface ChainIntegrityReport {
  checked_links: number;
  intact: boolean;
  first_broken_sequence: number | null;
  verified_at: ISODateTime;
}

export interface AdminKey {
  public_key: string;
  fingerprint: string;
  created_at: ISODateTime;
}
