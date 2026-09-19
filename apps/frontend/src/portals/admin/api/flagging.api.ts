import { ROUTES } from '@pramana/api-client';
import type { FlaggedCandidate, Page, PageQuery, PatientFlag } from '@pramana/types';
import { api } from './client';

/**
 * Flow 4, read-only from this app's point of view.
 *
 * The flagging engine produces candidates. It never suspends anyone, never
 * emails anyone and never writes to a doctor's record - it writes to this
 * queue, and a human decides. Note there is no "auto-action" endpoint here, and
 * that absence is the design, not an omission.
 */
export function listCandidates(query: PageQuery & { state?: string; severity?: string; rule?: string } = {}) {
  return api.get<Page<FlaggedCandidate>>(ROUTES.flaggedQueue, { query });
}

export function getCandidate(candidateId: string) {
  return api.get<FlaggedCandidate>(`${ROUTES.flaggedQueue}/${candidateId}`);
}

/** Prescriptions inside the candidate's window, for the evidence panel. */
export function getCandidateTimeline(candidateId: string) {
  return api.get<Array<{
    reference: string;
    signed_at: string;
    doctor_name: string;
    pharmacy_name: string | null;
    drug_name: string;
    is_controlled: boolean;
  }>>(`${ROUTES.flaggedQueue}/${candidateId}/timeline`);
}

export function listPatientFlags(query: PageQuery = {}) {
  return api.get<Page<PatientFlag>>(ROUTES.patientFlags, { query });
}
