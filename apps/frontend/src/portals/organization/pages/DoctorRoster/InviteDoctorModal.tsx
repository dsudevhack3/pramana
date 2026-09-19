import { useState } from 'react';
import { Field, InlineNotice, Input, Modal, useToast } from '@pramana/ui-components';
import { inviteDoctor } from '../../api/organizations.api';

/**
 * An invite is a request, not an assignment. The doctor accepts or declines,
 * and nothing about their account changes either way beyond a display badge.
 *
 * This uses the shared Modal in its default variant: it is not destructive, so
 * it does not demand a reason. Reserve the reason field for actions someone may
 * later have to justify.
 */
export function InviteDoctorModal({
  open, onClose, onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await inviteDoctor({ doctor_email: email.trim(), doctor_name: name.trim() || undefined });
      toast.show('Invite sent');
      setEmail('');
      setName('');
      onInvited();
      onClose();
    } catch {
      setError('The invite was not sent. Check the email address and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Invite a doctor"
      confirmLabel="Send the invite"
      busy={busy}
      onClose={onClose}
      onConfirm={send}
    >
      <div className="flex flex-col gap-4">
        <p>
          They will see the invite in their own portal and choose whether to accept. Until they do,
          nothing changes for them.
        </p>

        <Field label="Doctor's email" required htmlFor="invite-email" unbounded>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="dr.nambiar@example.in"
          />
        </Field>

        <Field label="Name" help="Optional. Only used to make the invite recognisable." htmlFor="invite-name" unbounded>
          <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Anjali Nambiar" />
        </Field>

        {error ? <InlineNotice tone="scarlet" title="Not sent" role="alert">{error}</InlineNotice> : null}

        <InlineNotice tone="neutral" title="Accepting adds a badge, nothing more">
          It does not give you access to their signing key, their patients or their prescriptions.
        </InlineNotice>
      </div>
    </Modal>
  );
}
