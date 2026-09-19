import { ROUTES } from '@pramana/api-client';
import type { Page, PageQuery } from '@pramana/types';
import { api } from './client';

/**
 * The append-only audit log: who read what, who changed what, and when.
 *
 * Distinct from the admin action ledger. The ledger holds signed enforcement
 * DECISIONS; this holds every event in the system, including the reads. An
 * admin opening a patient's flag history is itself an audited event, which is
 * how the product stays honest about the surveillance power it hands out.
 */
export interface AuditEntry {
  id: string;
  sequence: number;
  event: string;
  actor_type: 'doctor' | 'pharmacist' | 'admin' | 'system' | 'patient';
  actor_name: string;
  subject_type: string;
  subject_reference: string;
  ip_hash: string | null;
  occurred_at: string;
  metadata: Record<string, string | number | boolean | null>;
}

export function listAuditEntries(
  query: PageQuery & { actor_type?: string; event?: string; from?: string; to?: string } = {},
) {
  return api.get<Page<AuditEntry>>(ROUTES.auditLog, { query });
}

export function exportAuditEntries(query: { from: string; to: string }) {
  return api.get<{ download_url: string; expires_at: string }>(`${ROUTES.auditLog}/export`, { query });
}
