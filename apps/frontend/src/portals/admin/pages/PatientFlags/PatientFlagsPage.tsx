import { useEffect, useState } from 'react';
import { Badge, InlineNotice } from '@pramana/ui-components';
import type { PatientFlag } from '@pramana/types';
import { DataTable } from '../../components/common/DataTable';
import { listPatientFlags } from '../../api/flagging.api';

/**
 * Flow 5, patient branch. VIEW ONLY.
 *
 * Read this file before adding anything to it: there is deliberately no
 * suspend, ban, block or restrict control here, and none should be added. A
 * patient cannot be locked out of healthcare by this product. The strongest
 * thing that can happen to a patient is the advisory flag listed below, which
 * a prescriber sees as context while writing and is free to disregard.
 *
 * Flags are raised from the flagged-candidate detail screen, where the decision
 * is signed like every other. This page exists so an admin can see what is
 * currently in effect and for how long - not to act from.
 *
 * Phone numbers arrive masked from the backend and are never unmasked here.
 */
const RULE_LABEL: Record<string, string> = {
  doctor_shopping: 'Multiple prescribers',
  pharmacy_concentration: 'Single pharmacy',
  signing_pace: 'Signing pace',
  geo_mismatch: 'Location mismatch',
};

export function PatientFlagsPage() {
  const [rows, setRows] = useState<PatientFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listPatientFlags()
      .then((page) => setRows(page.items))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Patient flags</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Advisory context shown to prescribers while they write. Nothing on this page restricts anyone
          from being treated.
        </p>
      </header>

      <InlineNotice tone="neutral" title="Why there are no controls on this page">
        A patient is never suspended, blocked or banned by this system. A flag tells the next prescriber
        what other prescribers have already done, and the prescriber decides. That is how a prescription
        monitoring programme is supposed to work, and departing from it would push people toward
        untracked sources rather than away from them.
      </InlineNotice>

      {failed ? (
        <InlineNotice tone="amber" title="The list did not load" role="alert">Reload to try again.</InlineNotice>
      ) : null}

      {loading ? (
        <div className="skeleton h-[280px] rounded-card" />
      ) : (
        <DataTable
          caption="Advisory patient flags currently in effect"
          rows={rows}
          rowKey={(r) => r.id}
          severity={() => 'none'}
          filterText={(r) => `${r.patient_name} ${r.detail}`}
          filterPlaceholder="Filter by name or detail"
          emptyState="No advisory flags are in effect."
          columns={[
            { key: 'patient', header: 'Patient', render: (r) => r.patient_name, sortValue: (r) => r.patient_name },
            {
              key: 'phone',
              header: 'Phone',
              render: (r) => <span className="font-mono text-mono">{r.patient_phone_masked}</span>,
              hideOnCards: true,
            },
            {
              key: 'rule',
              header: 'Pattern',
              render: (r) => <Badge status="pending" label={RULE_LABEL[r.rule] ?? r.rule} />,
              sortValue: (r) => r.rule,
            },
            { key: 'detail', header: 'What a prescriber sees', render: (r) => <span className="max-w-measure">{r.detail}</span> },
            {
              key: 'raised',
              header: 'Raised',
              render: (r) => new Date(r.raised_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }),
              sortValue: (r) => r.raised_at,
            },
            {
              key: 'expires',
              header: 'Expires',
              render: (r) =>
                r.expires_at
                  ? new Date(r.expires_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                  : <span className="text-muted">No expiry set</span>,
              sortValue: (r) => r.expires_at ?? '',
            },
          ]}
        />
      )}
    </div>
  );
}
