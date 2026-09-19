import { useState } from 'react';
import { Button, DataTable, InlineNotice, Modal, useToast } from '@pramana/ui-components';
import type { Prescription } from '@pramana/types';
import { usePrescriptions } from '../../features/prescriptions/usePrescriptions';
import { PrescriptionStateBadge } from '../../components/common/StatusBadge';
import { voidPrescription } from '../../api/prescriptions.api';

/**
 * SS6: a real sortable table above 1024px, the same rows as stacked cards
 * below. That behaviour lives in <DataTable /> and is not re-implemented here.
 *
 * Voiding is the only destructive action a doctor has, and it is a Modal with a
 * required reason - the record is not deleted, it is superseded by a new signed
 * entry that says why.
 */
export function PrescriptionHistoryPage() {
  const { items, status, error, reload } = usePrescriptions(true);
  const [voiding, setVoiding] = useState<Prescription | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function confirmVoid(reason: string) {
    if (!voiding) return;
    setBusy(true);
    try {
      await voidPrescription(voiding.reference, reason);
      toast.show('Voided');
      setVoiding(null);
      void reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Prescriptions you have signed</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Every record here is sealed. Nothing on this page can be edited - a correction is a void plus
          a new prescription, and both are permanent.
        </p>
      </header>

      {status === 'error' ? (
        <InlineNotice tone="amber" title="The list did not load" role="alert">
          {error} <button type="button" className="underline" onClick={() => reload()}>Try again</button>
        </InlineNotice>
      ) : null}

      <DataTable
        caption="Prescriptions you have signed"
        rows={items}
        rowKey={(r) => r.reference}
        severity={(r) => (r.state === 'VOIDED' ? 'medium' : r.state === 'CONSUMED' ? 'ok' : 'none')}
        filterText={(r) => `${r.reference} ${r.payload.patient.name} ${r.payload.drugs[0]?.drug_name ?? ''}`}
        filterPlaceholder="Filter by patient, medicine or reference"
        emptyState="You have not signed anything yet. Your first prescription will appear here the moment it is sealed."
        columns={[
          {
            key: 'reference',
            header: 'Reference',
            render: (r) => <span className="font-mono text-mono">{r.reference}</span>,
            sortValue: (r) => r.reference,
          },
          {
            key: 'patient',
            header: 'Patient',
            render: (r) => r.payload.patient.name,
            sortValue: (r) => r.payload.patient.name,
          },
          {
            key: 'drug',
            header: 'Medicine',
            render: (r) => r.payload.drugs[0]?.drug_name ?? '—',
            sortValue: (r) => r.payload.drugs[0]?.drug_name ?? '',
          },
          {
            key: 'signed',
            header: 'Signed',
            render: (r) => new Date(r.signed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
            sortValue: (r) => r.signed_at,
          },
          {
            key: 'state',
            header: 'State',
            render: (r) => <PrescriptionStateBadge state={r.state} />,
            sortValue: (r) => r.state,
          },
          {
            key: 'actions',
            header: 'Action',
            align: 'right',
            render: (r) =>
              r.state === 'SEALED' ? (
                <Button size="sm" variant="ghost" onClick={() => setVoiding(r)}>Void</Button>
              ) : (
                <span className="text-caption text-muted">—</span>
              ),
          },
        ]}
      />

      <Modal
        open={Boolean(voiding)}
        variant="destructive"
        title={`Void ${voiding?.reference ?? ''}?`}
        confirmLabel="Void this prescription"
        reasonLabel="Why are you voiding it?"
        reasonHint="Wrong strength entered. Re-issuing at 250mg."
        busy={busy}
        onClose={() => setVoiding(null)}
        onConfirm={confirmVoid}
      >
        The record stays in the chain - voiding adds a new signed entry saying it should no longer be
        dispensed. If a pharmacist has already dispensed it, voiding does not undo that.
      </Modal>
    </div>
  );
}
