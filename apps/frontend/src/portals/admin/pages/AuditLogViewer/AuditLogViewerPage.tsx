import { useEffect, useState } from 'react';
import { Badge, Button, Field, InlineNotice, Input, Select, useToast } from '@pramana/ui-components';
import { DataTable } from '../../components/common/DataTable';
import { exportAuditEntries, listAuditEntries, type AuditEntry } from '../../api/audit.api';

/**
 * The append-only event log: reads as well as writes.
 *
 * An admin opening a patient's flag history is itself an audited event and
 * appears in this table. The product hands out real surveillance power, so the
 * use of that power is logged on the same terms as everything else.
 */
const ACTOR_BADGE: Record<string, { status: 'verified' | 'pending' | 'idle'; label: string }> = {
  doctor: { status: 'verified', label: 'Doctor' },
  pharmacist: { status: 'verified', label: 'Pharmacist' },
  admin: { status: 'pending', label: 'Admin' },
  system: { status: 'idle', label: 'System' },
  patient: { status: 'idle', label: 'Patient' },
};

export function AuditLogViewerPage() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [actorType, setActorType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    listAuditEntries({
      actor_type: actorType || undefined,
      from: from || undefined,
      to: to || undefined,
    })
      .then((page) => setRows(page.items))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [actorType, from, to]);

  async function exportRange() {
    if (!from || !to) return;
    const result = await exportAuditEntries({ from, to });
    window.open(result.download_url, '_blank', 'noopener');
    toast.show('Export ready');
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Audit log</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Every event in the system, including who read what. Append-only: entries are never edited or
          deleted.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] sm:items-end">
        <Field label="Actor" unbounded>
          <Select value={actorType} onChange={(e) => setActorType(e.target.value)}>
            <option value="">Everyone</option>
            <option value="doctor">Doctors</option>
            <option value="pharmacist">Pharmacists</option>
            <option value="admin">Admins</option>
            <option value="system">Background jobs</option>
          </Select>
        </Field>
        <Field label="From" unbounded>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To" unbounded>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Button variant="ghost" icon="download" disabled={!from || !to} onClick={exportRange}>
          Export this range
        </Button>
      </div>

      {failed ? (
        <InlineNotice tone="amber" title="The log did not load" role="alert">Reload to try again.</InlineNotice>
      ) : null}

      {loading ? (
        <div className="skeleton h-[340px] rounded-card" />
      ) : (
        <DataTable
          caption="Audit log entries"
          rows={rows}
          rowKey={(r) => r.id}
          severity={() => 'none'}
          filterText={(r) => `${r.event} ${r.actor_name} ${r.subject_reference}`}
          filterPlaceholder="Filter by event, actor or subject"
          emptyState="No events match these filters."
          columns={[
            {
              key: 'seq',
              header: '#',
              render: (r) => <span className="font-mono text-mono">{r.sequence}</span>,
              sortValue: (r) => r.sequence,
            },
            {
              key: 'when',
              header: 'When',
              render: (r) => new Date(r.occurred_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' }),
              sortValue: (r) => r.occurred_at,
            },
            { key: 'event', header: 'Event', render: (r) => r.event.replace(/[._]/g, ' '), sortValue: (r) => r.event },
            {
              key: 'actor',
              header: 'Actor',
              render: (r) => (
                <span className="flex flex-col">
                  <span>{r.actor_name}</span>
                  <Badge {...(ACTOR_BADGE[r.actor_type] ?? ACTOR_BADGE.system!)} />
                </span>
              ),
              sortValue: (r) => r.actor_name,
            },
            {
              key: 'subject',
              header: 'Subject',
              render: (r) => <span className="font-mono text-mono">{r.subject_reference}</span>,
              hideOnCards: true,
            },
          ]}
        />
      )}
    </div>
  );
}
