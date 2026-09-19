import { ROUTES, newIdempotencyKey } from '@pramana/api-client';
import { signPayload, unlockKey } from '@pramana/crypto';
import type { AdminAction, AdminActionType, ChainIntegrityReport, Page, PageQuery } from '@pramana/types';
import { api } from './client';

/**
 * Flow 5.
 *
 * Every enforcement decision is signed with the admin's own key before it
 * leaves the browser, and appended to the SAME hash chain as prescriptions.
 * Platform governance is therefore auditable on the same terms as the records
 * it governs - an admin cannot quietly suspend someone and edit the reason
 * later, because doing so would break the chain.
 *
 * The unwrapped key is held in a module variable for the tab's lifetime and
 * never enters React state or any store.
 */
let adminPrivateKey: CryptoKey | null = null;
let adminId: string | null = null;

export async function unlockAdminKey(id: string, passphrase: string): Promise<void> {
  adminPrivateKey = await unlockKey(id, passphrase);
  adminId = id;
}

export function lockAdminKey(): void {
  adminPrivateKey = null;
}

export function isAdminKeyUnlocked(): boolean {
  return adminPrivateKey !== null;
}

export interface EnforcementInput {
  action: AdminActionType;
  target_type: 'doctor' | 'pharmacy' | 'pharmacist' | 'patient' | 'organization';
  target_id: string;
  flagged_candidate_id?: string | null;
  /** Never empty - the destructive Modal enforces that before this is called. */
  reason: string;
}

export async function submitAction(input: EnforcementInput): Promise<AdminAction> {
  if (!adminPrivateKey || !adminId) {
    throw new Error('Unlock your signing key before recording a decision.');
  }
  if (!input.reason.trim()) {
    throw new Error('A reason is required. It is shown to the account holder and stored in the ledger.');
  }

  const idempotencyKey = newIdempotencyKey();
  const payload = {
    action: input.action,
    admin_id: adminId,
    flagged_candidate_id: input.flagged_candidate_id ?? null,
    idempotency_key: idempotencyKey,
    reason: input.reason.trim(),
    target_id: input.target_id,
    target_type: input.target_type,
  };

  const signature = await signPayload(adminPrivateKey, payload);

  return api.post<AdminAction>(
    ROUTES.adminActions,
    { ...payload, signature },
    { idempotencyKey },
  );
}

export function listActions(query: PageQuery & { target_type?: string; action?: string } = {}) {
  return api.get<Page<AdminAction>>(ROUTES.adminLedger, { query });
}

export function checkChainIntegrity() {
  return api.post<ChainIntegrityReport>(ROUTES.adminChainIntegrity, {});
}
