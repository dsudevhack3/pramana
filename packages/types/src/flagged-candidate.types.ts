import type { ISODateTime, UUID } from './common.types';

/**
 * Flow 4. flagging_engine runs deterministic, rule-based checks only - no ML,
 * no autonomous action. It produces candidates and writes only to the admin's
 * Flow 5 queue.
 */
export type FlaggingRule =
  | 'doctor_shopping'
  | 'pharmacy_concentration'
  | 'signing_pace'
  | 'geo_mismatch';

export type FlaggedActorType = 'doctor' | 'pharmacy' | 'pharmacist' | 'patient';

export type FlaggedCandidateState = 'OPEN' | 'ACTIONED' | 'DISMISSED' | 'ESCALATED';

/** Severity drives the DataTable row rule colour, per the SS1 state mapping. */
export type FlagSeverity = 'low' | 'medium' | 'high';

/**
 * One line of "why this fired". Rendered by <EvidencePanel /> identically on
 * the doctor, pharmacy and patient review pages.
 */
export interface EvidenceItem {
  label: string;
  value: string;
  /** The rule's configured threshold, shown beside the observed value. */
  threshold?: string;
  /** True when this specific line is what breached the threshold. */
  breached?: boolean;
}

export interface FlaggedCandidate {
  id: UUID;
  reference: string;
  actor_type: FlaggedActorType;
  actor_id: UUID;
  actor_name: string;
  rule: FlaggingRule;
  /** One plain-language sentence. No jargon, no rule ID. */
  headline: string;
  severity: FlagSeverity;
  state: FlaggedCandidateState;
  window_start: ISODateTime;
  window_end: ISODateTime;
  evidence: EvidenceItem[];
  created_at: ISODateTime;
  /** Set once an admin has acted; points at the signed ledger entry. */
  resolved_by_action_id: UUID | null;
}
