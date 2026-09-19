import { useCallback, useEffect, useState } from 'react';
import {
  Badge, Button, Card, CardBody, CardHeader, DataTable, InlineNotice, Modal, StatusRow, useToast,
} from '@pramana/ui-components';
import type { OrganizationInvite, RosterEntry } from '@pramana/types';
import { getRoster, listInvites, removeFromRoster, revokeInvite } from '../../api/organizations.api';
import { InviteStateBadge } from '../../components/common/OrgStatusBadge';
import { InviteDoctorModal } from './InviteDoctorModal';

/**
 * The roster.
 *
 * The trust columns here are the DOCTOR'S own status, never inherited from the
 * organisation. An org admin looking at this table sees that a doctor on their
 * roster can be unverified, and that the organisation's own verification did
 * nothing to change it.
 */
export function DoctorRosterPage() {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<RosterEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getRoster(), listInvites()])
      .then(([page, sent]) => {
        setRoster(page.items);
        setInvites(sent.filter((i) => i.state === 'SENT'));
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function confirmRemove(reason: string) {
    if (!removing) return;
    setBusy(true);
    try {
      await removeFromRoster(removing.doctor_id, reason);
      toast.show('Affiliation removed');
      setRemoving(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(invite: OrganizationInvite) {
    await revokeInvite(invite.id);
    toast.show('Invite withdrawn');
    load();
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-title-lg">Doctors</h1>
          <p className="max-w-measure text-body-sm text-muted">
            Everyone who has accepted an affiliation with you. Their verification is their own — you
            can see it here, but you cannot change it.
          </p>
        </div>
        <Button icon="plus" onClick={() => setInviting(true)}>Invite a doctor</Button>
      </header>

      {failed ? (
        <InlineNotice tone="amber" title="The roster did not load" role="alert">Reload to try again.</InlineNotice>
      ) : null}

      {invites.length > 0 ? (
        <Card>
          <CardHeader title="Invites waiting for a reply" description="Nothing changes for these doctors until they accept." />
          <CardBody>
            {invites.map((invite) => (
              <StatusRow
                key={invite.id}
                label={new Date(invite.sent_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                value={invite.doctor_name ?? invite.doctor_email}
                status={
                  <span className="flex items-center gap-2">
                    <InviteStateBadge state={invite.state} />
                    <Button size="sm" variant="ghost" onClick={() => withdraw(invite)}>Withdraw</Button>
                  </span>
                }
              />
            ))}
          </CardBody>
        </Card>
      ) : null}

      {loading ? (
        <div className="skeleton h-[280px] rounded-card" />
      ) : (
        <DataTable
          caption="Doctors affiliated with this organisation"
          rows={roster}
          rowKey={(r) => r.doctor_id}
          severity={(r) => (r.is_suspended ? 'high' : !r.govt_verified ? 'medium' : 'none')}
          filterText={(r) => `${r.doctor_name} ${r.license_number}`}
          filterPlaceholder="Filter by name or licence number"
          emptyState="Nobody has accepted an invite yet. Invites waiting for a reply appear above."
          columns={[
            { key: 'name', header: 'Doctor', render: (r) => r.doctor_name, sortValue: (r) => r.doctor_name },
            {
              key: 'licence',
              header: 'Licence',
              render: (r) => <span className="font-mono text-mono">{r.license_number}</span>,
              sortValue: (r) => r.license_number,
            },
            {
              key: 'govt',
              header: 'Licence verified',
              render: (r) => <Badge status={r.govt_verified ? 'verified' : 'pending'} label={r.govt_verified ? 'Verified' : 'Not yet'} />,
              sortValue: (r) => (r.govt_verified ? 1 : 0),
            },
            {
              key: 'platform',
              header: 'Can sign',
              render: (r) =>
                r.is_suspended
                  ? <Badge status="suspended" />
                  : <Badge status={r.platform_active ? 'verified' : 'idle'} label={r.platform_active ? 'Active' : 'Not registered'} />,
              sortValue: (r) => (r.is_suspended ? 0 : r.platform_active ? 2 : 1),
            },
            {
              key: 'volume',
              header: 'Last 30 days',
              align: 'right',
              render: (r) => r.prescriptions_30d.toLocaleString('en-IN'),
              sortValue: (r) => r.prescriptions_30d,
            },
            {
              key: 'remove',
              header: 'Affiliation',
              align: 'right',
              render: (r) => <Button size="sm" variant="ghost" onClick={() => setRemoving(r)}>Remove</Button>,
            },
          ]}
        />
      )}

      <InviteDoctorModal open={inviting} onClose={() => setInviting(false)} onInvited={load} />

      <Modal
        open={Boolean(removing)}
        variant="destructive"
        title={`Remove ${removing?.doctor_name ?? ''} from the roster?`}
        confirmLabel="Remove the affiliation"
        reasonLabel="Why are you removing them?"
        reasonHint="Left the practice in September."
        busy={busy}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
      >
        This removes your name from the prescriptions they sign in future. It does not suspend them,
        touch their licence, or change anything about prescriptions they have already signed — those
        keep the affiliation that was true at the time.
      </Modal>
    </div>
  );
}
