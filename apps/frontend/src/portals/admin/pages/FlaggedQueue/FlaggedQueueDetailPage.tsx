import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge, Button, Card, CardBody, CardHeader, InlineNotice, Modal, RecordHash, StatusRow, useToast,
} from '@pramana/ui-components';
import type { AdminActionType, FlaggedCandidate } from '@pramana/types';
import { getCandidate, getCandidateTimeline } from '../../api/flagging.api';
import { isAdminKeyUnlocked, submitAction } from '../../api/enforcement.api';
import { EvidencePanel } from '../../components/common/EvidencePanel';

/**
 * Flow 5, the decision.
 *
 * Every outcome here goes through the destructive Modal, which will not enable
 * its confirm button until a reason is typed - including "dismiss", because a
 * dismissal is a decision someone may need to justify later just as much as a
 * suspension.
 *
 * SS5/workflow: for a patient subject, the ONLY available outcomes are a soft
 * flag or a dismissal. There is no suspend control rendered for patients
 * anywhere in this app - not disabled, not hidden behind a permission. It does
 * not exist, because you cannot lock a patient out of healthcare.
 */
type Timeline = Awaited<ReturnType<typeof getCandidateTimeline>>;

interface Outcome {
  key: string;
  label: string;
  action: AdminActionType;
  destructive: boolean;
  hint: string;
}

function outcomesFor(candidate: FlaggedCandidate): Outcome[] {
  const dismiss: Outcome = {
    key: 'dismiss',
    label: 'Dismiss this flag',
    action: 'DISMISS_FLAG',
    destructive: true,
    hint: 'The pattern is explained. Say why, so the next reviewer does not re-open it.',
  };
  const escalate: Outcome = {
    key: 'escalate',
    label: 'Escalate for a second opinion',
    action: 'ESCALATE_FLAG',
    destructive: true,
    hint: 'Keeps the candidate open and records that you looked and were unsure.',
  };

  switch (candidate.actor_type) {
    case 'doctor':
      return [
        { key: 'suspend', label: 'Suspend signing', action: 'SUSPEND_DOCTOR', destructive: true,
          hint: 'Blocks new prescriptions immediately. Everything already signed stays valid.' },
        escalate, dismiss,
      ];
    case 'pharmacy':
      return [
        { key: 'suspend', label: 'Suspend dispensing', action: 'SUSPEND_PHARMACY', destructive: true,
          hint: 'Blocks scan-and-consume. They can still check whether a prescription is genuine.' },
        escalate, dismiss,
      ];
    case 'pharmacist':
      return [
        { key: 'suspend', label: 'Suspend this pharmacist', action: 'SUSPEND_PHARMACIST', destructive: true,
          hint: 'Affects one account, not the whole pharmacy.' },
        escalate, dismiss,
      ];
    case 'patient':
      return [
        { key: 'flag', label: 'Add an advisory flag', action: 'SOFT_FLAG_PATIENT', destructive: true,
          hint: 'Prescribers see this as context while writing. It never blocks anyone from being treated.' },
        dismiss,
      ];
    default:
      return [dismiss];
  }
}

export function FlaggedQueueDetailPage() {
  const { candidateId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [candidate, setCandidate] = useState<FlaggedCandidate | null>(null);
  const [timeline, setTimeline] = useState<Timeline>([]);
  const [pending, setPending] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCandidate(candidateId).then(setCandidate).catch(() => setError('This candidate could not be loaded.'));
    getCandidateTimeline(candidateId).then(setTimeline).catch(() => setTimeline([]));
  }, [candidateId]);

  async function confirm(reason: string) {
    if (!candidate || !pending) return;
    setBusy(true);
    setError(null);
    try {
      await submitAction({
        action: pending.action,
        target_type: candidate.actor_type,
        target_id: candidate.actor_id,
        flagged_candidate_id: candidate.id,
        reason,
      });
      toast.show('Decision signed and recorded');
      navigate(ROUTES.admin.flagged);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The decision was not recorded. Nothing changed.');
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  if (!candidate) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-9 w-64 rounded-control" />
        <div className="skeleton h-64 w-full rounded-card" />
      </div>
    );
  }

  const outcomes = outcomesFor(candidate);
  const locked = !isAdminKeyUnlocked();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" icon="arrowLeft" onClick={() => navigate(ROUTES.admin.flagged)}>
            Back to the queue
          </Button>
          <h1 className="text-title-lg">{candidate.actor_name}</h1>
          <span className="font-mono text-mono text-muted">{candidate.reference}</span>
        </div>
        <Badge
          status={candidate.severity === 'high' ? 'rejected' : candidate.severity === 'medium' ? 'pending' : 'idle'}
          label={`${candidate.severity} severity`}
        />
      </div>

      {locked ? (
        <InlineNotice tone="amber" title="Your signing key is locked">
          You can read everything here, but recording a decision needs your key.{' '}
          <button type="button" className="underline" onClick={() => navigate(ROUTES.admin.settingsKey)}>
            Unlock it
          </button>
        </InlineNotice>
      ) : null}

      {error ? <InlineNotice tone="scarlet" title="Not recorded" role="alert">{error}</InlineNotice> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="flex flex-col gap-5">
          <EvidencePanel
            rule={candidate.rule}
            headline={candidate.headline}
            evidence={candidate.evidence}
            windowStart={candidate.window_start}
            windowEnd={candidate.window_end}
          />

          {timeline.length > 0 ? (
            <Card>
              <CardHeader
                title="Prescriptions in this window"
                description="The records the rule actually counted. Open any of them to see what was signed."
              />
              <CardBody>
                {timeline.map((entry) => (
                  <StatusRow
                    key={entry.reference}
                    label={new Date(entry.signed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    value={
                      <span className="flex flex-col">
                        <span>{entry.drug_name}</span>
                        <span className="text-caption text-muted">
                          {entry.doctor_name}
                          {entry.pharmacy_name ? ` → ${entry.pharmacy_name}` : ' → not dispensed'}
                        </span>
                      </span>
                    }
                    status={entry.is_controlled ? <Badge status="pending" label="Controlled" /> : undefined}
                  />
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>

        <Card className="lg:sticky lg:top-[130px]">
          <CardHeader
            title="Your decision"
            description="Whatever you choose is signed with your key and appended to the shared chain."
          />
          <CardBody className="flex flex-col gap-3">
            {candidate.actor_type === 'patient' ? (
              <InlineNotice tone="neutral" title="Patients are never suspended">
                There is no control here to block this person, and there is not one elsewhere either.
                An advisory flag gives prescribers context; the prescriber still decides.
              </InlineNotice>
            ) : null}

            {outcomes.map((outcome) => (
              <div key={outcome.key} className="flex flex-col gap-1">
                <Button
                  variant={outcome.action.startsWith('SUSPEND') ? 'destructive' : 'ghost'}
                  fullWidth
                  disabled={locked}
                  onClick={() => setPending(outcome)}
                >
                  {outcome.label}
                </Button>
                <span className="max-w-measure text-caption text-muted">{outcome.hint}</span>
              </div>
            ))}

            {candidate.resolved_by_action_id ? (
              <RecordHash
                hash={candidate.resolved_by_action_id}
                caption="This candidate has already been resolved by a signed decision"
              />
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={Boolean(pending)}
        variant="destructive"
        title={pending ? `${pending.label}?` : ''}
        confirmLabel="Sign and record"
        reasonLabel="Reason, shown to the account holder and stored in the ledger"
        reasonHint="State the rule, the numbers it cites, and what you concluded."
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={confirm}
      >
        This is signed with your key and appended to the same chain as the prescriptions it concerns.
        It cannot be edited or removed afterwards - a change of mind is a new, separate entry.
      </Modal>
    </div>
  );
}
