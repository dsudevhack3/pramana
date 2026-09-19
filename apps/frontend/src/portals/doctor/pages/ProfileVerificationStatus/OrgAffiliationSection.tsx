import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, InlineNotice, Modal, useToast } from '@pramana/ui-components';
import type { Doctor, OrganizationInvite } from '@pramana/types';
import { leaveOrganization, listMyInvites, respondToInvite } from '../../api/doctors.api';

/**
 * Flow 1, step 6, and its ongoing state.
 *
 * Affiliation is a display layer. Accepting adds a badge; it never touches the
 * signing key, the licence status or the trust root. The copy says that
 * explicitly, because it is the single thing a doctor is most likely to
 * misunderstand about joining an organisation.
 */
export function OrgAffiliationSection({
  doctor, onChanged,
}: {
  doctor: Doctor;
  onChanged: (doctor: Doctor) => void;
}) {
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    listMyInvites().then((all) => setInvites(all.filter((i) => i.state === 'SENT'))).catch(() => setInvites([]));
  }, [doctor.organization_id]);

  async function answer(invite: OrganizationInvite, accept: boolean) {
    setBusy(true);
    try {
      await respondToInvite(invite.id, accept);
      setInvites((cur) => cur.filter((i) => i.id !== invite.id));
      toast.show(accept ? `Affiliated with ${invite.organization_name}` : 'Invite declined');
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setBusy(true);
    try {
      onChanged(await leaveOrganization());
      toast.show('Affiliation removed');
      setLeaving(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Organisation"
        description="A badge on your prescriptions, nothing more. Your keys and your licence stay yours."
        actions={
          doctor.organization_name ? (
            <Badge status="verified" label={doctor.organization_name} />
          ) : (
            <Badge status="idle" label="Independent practice" />
          )
        }
      />
      <CardBody className="flex flex-col gap-4">
        <InlineNotice tone="neutral" title="What affiliation does and does not do">
          It adds your organisation&apos;s name to the trust result a pharmacist sees. It does not let
          an organisation admin sign on your behalf, change your licence status, or read your signing
          key - none of those are technically possible, not merely disallowed.
        </InlineNotice>

        {invites.length > 0 ? (
          <ul className="flex list-none flex-col gap-3 p-0">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line p-3"
              >
                <div className="flex flex-col">
                  <strong className="text-body-sm font-semibold">{invite.organization_name}</strong>
                  <span className="text-caption text-muted">
                    Invited {new Date(invite.sent_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => answer(invite, false)}>Decline</Button>
                  <Button size="sm" disabled={busy} onClick={() => answer(invite, true)}>Accept</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {doctor.organization_name ? (
          <div>
            <Button variant="ghost" onClick={() => setLeaving(true)}>Leave {doctor.organization_name}</Button>
          </div>
        ) : null}
      </CardBody>

      <Modal
        open={leaving}
        title={`Leave ${doctor.organization_name ?? ''}?`}
        confirmLabel="Leave the organisation"
        busy={busy}
        onClose={() => setLeaving(false)}
        onConfirm={leave}
      >
        New prescriptions will show you as an independent practitioner. Prescriptions you already
        signed keep the affiliation they recorded at the time, because that is what was true then.
      </Modal>
    </Card>
  );
}
