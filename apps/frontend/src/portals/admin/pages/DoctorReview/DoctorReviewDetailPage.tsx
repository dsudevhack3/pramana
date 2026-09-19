import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge, Button, Card, CardBody, CardHeader, InlineNotice, Modal, StatusRow, useToast,
} from '@pramana/ui-components';
import type { Doctor, LicenseStatusHistoryEntry } from '@pramana/types';
import { getDoctorReview } from '../../api/admin.api';
import { isAdminKeyUnlocked, submitAction } from '../../api/enforcement.api';

/**
 * The comparison screen.
 *
 * SS2: the two names being compared are set in IBM Plex Mono - the ONLY place
 * the product uses monospace for something that is not a hash or an identifier,
 * and it earns it, because a reviewer is reading character by character to spot
 * an initial or a transposition.
 */
type Review = Doctor & { license_history: LicenseStatusHistoryEntry[] };

export function DoctorReviewDetailPage() {
  const { doctorId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [doctor, setDoctor] = useState<Review | null>(null);
  const [pending, setPending] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDoctorReview(doctorId).then(setDoctor).catch(() => setError('This registration could not be loaded.'));
  }, [doctorId]);

  async function confirm(reason: string) {
    if (!doctor || !pending) return;
    setBusy(true);
    setError(null);
    try {
      await submitAction({
        action: pending === 'approve' ? 'APPROVE_DOCTOR' : pending === 'reject' ? 'REJECT_DOCTOR' : 'SUSPEND_DOCTOR',
        target_type: 'doctor',
        target_id: doctor.id,
        reason,
      });
      toast.show('Decision signed and recorded');
      navigate(ROUTES.admin.doctors);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The decision was not recorded.');
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  if (!doctor) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-9 w-64 rounded-control" />
        <div className="skeleton h-72 w-full rounded-card" />
      </div>
    );
  }

  const locked = !isAdminKeyUnlocked();
  const registryName = doctor.license?.registrant_name ?? '';
  const aadhaarName = doctor.aadhaar?.name ?? doctor.name;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" icon="arrowLeft" onClick={() => navigate(ROUTES.admin.doctors)}>
          Back to registrations
        </Button>
        <h1 className="text-title-lg">{doctor.name}</h1>
      </div>

      {locked ? (
        <InlineNotice tone="amber" title="Your signing key is locked">
          Unlock it before approving or rejecting anything.{' '}
          <button type="button" className="underline" onClick={() => navigate(ROUTES.admin.settingsKey)}>Unlock</button>
        </InlineNotice>
      ) : null}
      {error ? <InlineNotice tone="scarlet" title="Not recorded" role="alert">{error}</InlineNotice> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader
              title="Compare the two names"
              description="The register on one side, the Aadhaar record on the other. Read them character by character."
            />
            <CardBody className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1 rounded-control border border-line p-3">
                  <span className="text-caption text-muted">On the council register</span>
                  <span className="font-mono text-body break-words">{registryName || '—'}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-control border border-line p-3">
                  <span className="text-caption text-muted">On the Aadhaar record</span>
                  <span className="font-mono text-body break-words">{aadhaarName || '—'}</span>
                </div>
              </div>

              <StatusRow
                label="Confidence reported"
                value={`${Math.round((doctor.license?.match_confidence ?? 0) * 100)}%`}
                status={<Badge status="pending" label={doctor.license?.match_result ?? 'unknown'} />}
              />
              <StatusRow label="Date of birth on the register" value={doctor.license?.registrant_dob ?? '—'} mono />
              <StatusRow label="Date of birth on Aadhaar" value={doctor.aadhaar?.dob ?? '—'} mono />
              <StatusRow label="Licence number" value={doctor.license?.license_number ?? '—'} mono />
              <StatusRow label="Council" value={doctor.license?.council_name ?? '—'} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Clinic" description="What the doctor submitted, and what we could confirm." />
            <CardBody>
              <StatusRow
                label="Address"
                value={doctor.clinic?.address.line1 ?? 'Not submitted'}
                status={doctor.clinic?.maps_confirmed ? <Badge status="verified" label="Found" /> : <Badge status="idle" />}
              />
              <StatusRow
                label="Establishment certificate"
                value={doctor.clinic?.establishment_cert_number ?? 'Not provided'}
                status={
                  doctor.clinic?.establishment_cert_confirmed
                    ? <Badge status="verified" />
                    : <Badge status="idle" label="Unconfirmed" />
                }
              />
              <StatusRow
                label="Photo taken at the clinic"
                value={
                  doctor.clinic?.photo_distance_metres != null
                    ? `${doctor.clinic.photo_distance_metres}m from the resolved address`
                    : 'Not submitted'
                }
                status={
                  (doctor.clinic?.photo_distance_metres ?? 9999) < 150
                    ? <Badge status="verified" label="In range" />
                    : <Badge status="pending" label="Out of range" />
                }
              />
              {doctor.clinic?.geotagged_photo_url ? (
                <img
                  src={doctor.clinic.geotagged_photo_url}
                  alt={`Clinic frontage submitted by ${doctor.name}`}
                  className="mt-3 max-h-[280px] w-full rounded-control border border-line object-cover"
                />
              ) : null}
            </CardBody>
          </Card>

          {doctor.license_history.length > 0 ? (
            <Card>
              <CardHeader title="Licence status history" description="Every observation we have made, kept rather than overwritten." />
              <CardBody>
                {doctor.license_history.map((entry) => (
                  <StatusRow
                    key={entry.id}
                    label={new Date(entry.observed_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    value={entry.note ?? entry.source.replace(/_/g, ' ')}
                    status={<Badge status={entry.status === 'VERIFIED' ? 'verified' : entry.status === 'REVOKED' ? 'suspended' : 'pending'} label={entry.status.toLowerCase()} />}
                  />
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>

        <Card className="lg:sticky lg:top-[130px]">
          <CardHeader title="Your decision" description="Signed with your key, and readable by this doctor." />
          <CardBody className="flex flex-col gap-3">
            <Button fullWidth disabled={locked} onClick={() => setPending('approve')}>
              Approve this registration
            </Button>
            <span className="text-caption text-muted">
              The doctor can generate a signing key and start prescribing immediately.
            </span>

            <Button variant="destructive" fullWidth disabled={locked} onClick={() => setPending('reject')}>
              Reject this registration
            </Button>
            <span className="text-caption text-muted">
              They see your reason verbatim and can correct the details and resubmit.
            </span>

            {doctor.platform_status === 'ACTIVE' ? (
              <>
                <Button variant="destructive" fullWidth disabled={locked} onClick={() => setPending('suspend')}>
                  Suspend signing
                </Button>
                <span className="text-caption text-muted">
                  For an already-active doctor. Existing prescriptions stay valid.
                </span>
              </>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={Boolean(pending)}
        variant="destructive"
        title={
          pending === 'approve' ? 'Approve this registration?'
          : pending === 'reject' ? 'Reject this registration?'
          : 'Suspend this doctor?'
        }
        confirmLabel="Sign and record"
        reasonLabel="Reason, shown to the doctor and stored in the ledger"
        reasonHint="Register lists the maiden name; Aadhaar shows the married name. Date of birth and licence number both match."
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirm}
      >
        Your decision is signed and appended to the shared chain. The doctor reads this reason as
        written, so write it for them rather than for an internal log.
      </Modal>
    </div>
  );
}
