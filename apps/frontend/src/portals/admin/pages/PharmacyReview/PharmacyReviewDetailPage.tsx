import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge, Button, Card, CardBody, CardHeader, InlineNotice, Modal, StatusRow, useToast,
} from '@pramana/ui-components';
import type { Pharmacy } from '@pramana/types';
import { getPharmacyReview } from '../../api/admin.api';
import { isAdminKeyUnlocked, submitAction } from '../../api/enforcement.api';

type Review = Pharmacy & { pharmacist_name: string; pharmacist_email: string };

/**
 * Flow 0.5 approval and Flow 5 enforcement, on one screen.
 *
 * Suspending a pharmacy blocks scan-and-consume but never verification. A
 * patient standing at a suspended pharmacy's counter should still be able to
 * find out whether their prescription is real - the suspension is aimed at the
 * business, not at them.
 */
export function PharmacyReviewDetailPage() {
  const { pharmacyId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [pharmacy, setPharmacy] = useState<Review | null>(null);
  const [pending, setPending] = useState<'approve' | 'reject' | 'suspend' | 'lift' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPharmacyReview(pharmacyId).then(setPharmacy).catch(() => setError('This pharmacy could not be loaded.'));
  }, [pharmacyId]);

  async function confirm(reason: string) {
    if (!pharmacy || !pending) return;
    setBusy(true);
    setError(null);
    try {
      await submitAction({
        action:
          pending === 'approve' ? 'APPROVE_PHARMACY'
          : pending === 'reject' ? 'REJECT_PHARMACY'
          : pending === 'suspend' ? 'SUSPEND_PHARMACY'
          : 'LIFT_SUSPENSION',
        target_type: 'pharmacy',
        target_id: pharmacy.id,
        reason,
      });
      toast.show('Decision signed and recorded');
      navigate(ROUTES.admin.pharmacies);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The decision was not recorded.');
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  if (!pharmacy) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-9 w-64 rounded-control" />
        <div className="skeleton h-64 w-full rounded-card" />
      </div>
    );
  }

  const locked = !isAdminKeyUnlocked();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" icon="arrowLeft" onClick={() => navigate(ROUTES.admin.pharmacies)}>
          Back to pharmacies
        </Button>
        <h1 className="text-title-lg">{pharmacy.name}</h1>
      </div>

      {locked ? (
        <InlineNotice tone="amber" title="Your signing key is locked">
          Unlock it before recording a decision.{' '}
          <button type="button" className="underline" onClick={() => navigate(ROUTES.admin.settingsKey)}>Unlock</button>
        </InlineNotice>
      ) : null}
      {error ? <InlineNotice tone="scarlet" title="Not recorded" role="alert">{error}</InlineNotice> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <Card>
          <CardHeader title="Registration" description="What was submitted, and what we could confirm independently." />
          <CardBody>
            <StatusRow label="Licence number" value={pharmacy.license_number} mono />
            <StatusRow label="Issuing council" value={pharmacy.council_name} />
            <StatusRow
              label="Address"
              value={pharmacy.address.line1}
              status={<Badge status={pharmacy.maps_confirmed ? 'verified' : 'idle'} label={pharmacy.maps_confirmed ? 'Found' : 'Unconfirmed'} />}
            />
            <StatusRow label="Named pharmacist" value={pharmacy.pharmacist_name} />
            <StatusRow label="Contact email" value={pharmacy.pharmacist_email} />
            <StatusRow
              label="Registered"
              value={new Date(pharmacy.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
            />
            {pharmacy.approved_at ? (
              <StatusRow
                label="Approved"
                value={new Date(pharmacy.approved_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                status={<Badge status="verified" />}
              />
            ) : null}
          </CardBody>
        </Card>

        <Card className="lg:sticky lg:top-[130px]">
          <CardHeader title="Your decision" description="Signed with your key, and readable by this pharmacy." />
          <CardBody className="flex flex-col gap-3">
            {pharmacy.status === 'PENDING' ? (
              <>
                <Button fullWidth disabled={locked} onClick={() => setPending('approve')}>Approve this pharmacy</Button>
                <span className="text-caption text-muted">
                  Its pharmacists can sign in and begin marking prescriptions as dispensed.
                </span>
                <Button variant="destructive" fullWidth disabled={locked} onClick={() => setPending('reject')}>
                  Reject this registration
                </Button>
              </>
            ) : null}

            {pharmacy.status === 'APPROVED' ? (
              <>
                <Button variant="destructive" fullWidth disabled={locked} onClick={() => setPending('suspend')}>
                  Suspend dispensing
                </Button>
                <span className="max-w-measure text-caption text-muted">
                  Blocks scan-and-consume. Verification keeps working, so a patient at their counter can
                  still check their own prescription.
                </span>
              </>
            ) : null}

            {pharmacy.status === 'SUSPENDED' ? (
              <>
                <InlineNotice tone="scarlet" title="Currently suspended">
                  They cannot mark prescriptions as dispensed.
                </InlineNotice>
                <Button fullWidth disabled={locked} onClick={() => setPending('lift')}>Lift the suspension</Button>
              </>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={Boolean(pending)}
        variant="destructive"
        title={
          pending === 'approve' ? 'Approve this pharmacy?'
          : pending === 'reject' ? 'Reject this registration?'
          : pending === 'suspend' ? 'Suspend dispensing?'
          : 'Lift this suspension?'
        }
        confirmLabel="Sign and record"
        reasonLabel="Reason, shown to the pharmacy and stored in the ledger"
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirm}
      >
        Signed with your key and appended to the shared chain. The pharmacy reads this reason exactly as
        you write it.
      </Modal>
    </div>
  );
}
