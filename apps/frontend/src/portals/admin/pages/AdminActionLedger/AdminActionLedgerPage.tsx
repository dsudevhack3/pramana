import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, InlineNotice, RecordHash, StatusRow } from '@pramana/ui-components';
import type { AdminAction, ChainIntegrityReport } from '@pramana/types';
import { DataTable } from '../../components/common/DataTable';
import { checkChainIntegrity, listActions } from '../../api/enforcement.api';

/**
 * Every enforcement decision ever made, in chain order.
 *
 * This page is the argument for the whole design: an admin cannot suspend
 * someone quietly, cannot edit the reason afterwards, and cannot remove the
 * entry - doing any of those breaks a hash that anyone can recompute here.
 * Admins are subject to the same mechanism as the doctors they oversee.
 */
const ACTION_LABEL: Record<string, string> = {
  SUSPEND_DOCTOR: 'Suspended a doctor',
  SUSPEND_PHARMACY: 'Suspended a pharmacy',
  SUSPEND_PHARMACIST: 'Suspended a pharmacist',
  SOFT_FLAG_PATIENT: 'Added a patient advisory flag',
  DISMISS_FLAG: 'Dismissed a flag',
  ESCALATE_FLAG: 'Escalated a flag',
  APPROVE_DOCTOR: 'Approved a doctor',
  REJECT_DOCTOR: 'Rejected a doctor',
  APPROVE_PHARMACY: 'Approved a pharmacy',
  REJECT_PHARMACY: 'Rejected a pharmacy',
  LIFT_SUSPENSION: 'Lifted a suspension',
};

export function AdminActionLedgerPage() {
  const [rows, setRows] = useState<AdminAction[]>([]);
  const [selected, setSelected] = useState<AdminAction | null>(null);
  const [integrity, setIntegrity] = useState<ChainIntegrityReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listActions()
      .then((page) => setRows(page.items))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  async function verify() {
    setChecking(true);
    try {
      setIntegrity(await checkChainIntegrity());
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Decision ledger</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Every enforcement decision, signed by the admin who made it and chained to the record before
          it. Nothing here can be edited or removed after the fact.
        </p>
      </header>

      <Card>
        <CardHeader
          title="Verify the chain yourself"
          description="Recomputes each hash from the record it claims to follow and compares it to what is stored."
          actions={
            <Button variant="ghost" icon="refresh" loading={checking} loadingLabel="Recomputing" onClick={verify}>
              Recompute now
            </Button>
          }
        />
        {integrity ? (
          <CardBody>
            <StatusRow
              label="Links checked"
              value={integrity.checked_links.toLocaleString('en-IN')}
              status={<Badge status={integrity.intact ? 'verified' : 'rejected'} label={integrity.intact ? 'Intact' : 'Broken'} />}
            />
            <StatusRow
              label="Result"
              value={
                integrity.intact
                  ? 'Every link recomputed to the stored value.'
                  : `The chain first fails to recompute at sequence ${integrity.first_broken_sequence}.`
              }
            />
            <StatusRow
              label="Checked at"
              value={new Date(integrity.verified_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' })}
            />
          </CardBody>
        ) : null}
      </Card>

      {failed ? (
        <InlineNotice tone="amber" title="The ledger did not load" role="alert">Reload to try again.</InlineNotice>
      ) : null}

      {loading ? (
        <div className="skeleton h-[320px] rounded-card" />
      ) : (
        <DataTable
          caption="Signed admin decisions in chain order"
          rows={rows}
          rowKey={(r) => r.id}
          severity={(r) => (r.action.startsWith('SUSPEND') ? 'high' : r.action.startsWith('APPROVE') ? 'ok' : 'none')}
          onRowActivate={setSelected}
          filterText={(r) => `${r.admin_name} ${r.target_name} ${ACTION_LABEL[r.action] ?? r.action} ${r.reason}`}
          filterPlaceholder="Filter by admin, subject, action or reason"
          emptyState="No decisions have been recorded yet."
          columns={[
            {
              key: 'seq',
              header: '#',
              render: (r) => <span className="font-mono text-mono">{r.sequence}</span>,
              sortValue: (r) => r.sequence,
            },
            {
              key: 'action',
              header: 'Decision',
              render: (r) => ACTION_LABEL[r.action] ?? r.action,
              sortValue: (r) => r.action,
            },
            { key: 'target', header: 'Subject', render: (r) => r.target_name, sortValue: (r) => r.target_name },
            { key: 'admin', header: 'Made by', render: (r) => r.admin_name, sortValue: (r) => r.admin_name },
            {
              key: 'when',
              header: 'When',
              render: (r) => new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
              sortValue: (r) => r.created_at,
            },
            {
              key: 'reason',
              header: 'Reason',
              render: (r) => <span className="line-clamp-2 max-w-measure">{r.reason}</span>,
              hideOnCards: true,
            },
          ]}
        />
      )}

      {selected ? (
        <Card>
          <CardHeader
            title={`Entry #${selected.sequence}`}
            description={ACTION_LABEL[selected.action] ?? selected.action}
            actions={<Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>}
          />
          <CardBody className="flex flex-col gap-4">
            <StatusRow label="Subject" value={`${selected.target_name} (${selected.target_type})`} />
            <StatusRow label="Reason given" value={selected.reason} />
            {selected.flagged_candidate_reference ? (
              <StatusRow label="Evidence cited" value={selected.flagged_candidate_reference} mono />
            ) : null}
            <StatusRow label="Signed by" value={selected.admin_name} />
            <StatusRow
              label="When"
              value={new Date(selected.created_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' })}
            />
            <RecordHash hash={selected.record_hash} caption="This entry's hash" />
            <RecordHash hash={selected.previous_record_hash} caption="The hash of the record immediately before it" />
            <RecordHash hash={selected.signature} caption="The admin's signature over this decision" />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
