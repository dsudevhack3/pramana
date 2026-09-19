import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge, Button, Field, Icon, InlineNotice, Input, QRCode, RecordHash,
  SealMark, StatusRow, cn, useReducedMotion, useToast,
} from '@pramana/ui-components';
import { DUR } from '@pramana/ui-components';
import type { Prescription, PrescriptionPayload } from '@pramana/types';
import { useAuth } from '../../features/auth/useAuth';
import { usePrescriptions } from '../../features/prescriptions/usePrescriptions';

/**
 * Flow 2, the signing moment. SS7.2: this is the product's ONE deliberately
 * theatrical animation, and it gets real craft.
 *
 * The gesture is press-and-hold, not a click, for two reasons: it is the
 * deliberate confirming gesture an irreversible action deserves, and holding
 * for DUR.fill gives the progress indicator something true to show. Releasing
 * early cancels, and nothing has left the device at that point.
 *
 * Sequence on commit:
 *   hold DUR.fill -> sign locally -> POST -> seal scales in from 2.4x and
 *   settles at -6deg -> the sealed record's fields fade in on a 60ms stagger.
 *
 * SS9: the button says "Sign and seal" and the state it produces is called
 * "Sealed". The verb survives the flow.
 */
type Phase = 'locked' | 'ready' | 'holding' | 'signing' | 'sealed' | 'error';

export function SignAndSubmitPanel({
  payload,
  valid,
  onSealed,
}: {
  payload: PrescriptionPayload | null;
  valid: boolean;
  onSealed: (record: Prescription) => void;
}) {
  const { doctor, canSign, signingUnlocked, unlockSigning } = useAuth();
  const { signAndSeal } = usePrescriptions();
  const reduced = useReducedMotion();
  const toast = useToast();

  const [phase, setPhase] = useState<Phase>('ready');
  const [passphrase, setPassphrase] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<Prescription | null>(null);
  const holdTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!signingUnlocked && phase !== 'sealed') setPhase('locked');
    else if (phase === 'locked' && signingUnlocked) setPhase('ready');
  }, [signingUnlocked, phase]);

  useEffect(() => () => { if (holdTimer.current) window.clearTimeout(holdTimer.current); }, []);

  const commit = useCallback(async () => {
    if (!payload) return;
    setPhase('signing');
    setError(null);
    try {
      const sealed = await signAndSeal(payload);
      // A real haptic pulse where the device supports it - this is the one
      // moment in the product that earns it.
      navigator.vibrate?.(18);
      setRecord(sealed);
      setPhase('sealed');
      toast.show('Sealed');
      onSealed(sealed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The record was not sealed. Nothing was saved, so you can try again.');
      setPhase('error');
    }
  }, [payload, signAndSeal, toast, onSealed]);

  function startHold() {
    if (!valid || !canSign) return;
    setPhase('holding');
    holdTimer.current = window.setTimeout(commit, reduced ? DUR.quick : DUR.fill);
  }

  function cancelHold() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setPhase((p) => (p === 'holding' ? 'ready' : p));
  }

  /* ---- sealed ------------------------------------------------------------ */
  if (phase === 'sealed' && record) {
    const fields: Array<[string, React.ReactNode]> = [
      ['Reference', <span className="font-mono text-mono">{record.reference}</span>],
      ['Patient', record.payload.patient.name],
      ['Signed at', new Date(record.signed_at).toLocaleString('en-IN')],
      ['Licence status recorded', record.doctor_license_status_at_signing],
      ['Position in the chain', `#${record.chain_height.toLocaleString('en-IN')}`],
    ];

    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <SealMark size={72} mode="stamp" />
          <div className="flex flex-col gap-1">
            <h2 className="text-title">Sealed</h2>
            <p className="max-w-measure text-body-sm text-muted">
              Signed with your key and written to the chain. It cannot be edited from here - only voided
              or amended, and both of those leave their own record.
            </p>
          </div>
        </div>

        <div className="seal-stagger flex flex-col">
          {fields.map(([label, value], i) => (
            <div key={label} style={{ ['--stagger-index' as string]: i }}>
              <StatusRow
                label={label}
                value={value}
                status={i === 0 ? <Badge status="sealed" /> : undefined}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-start gap-5">
          <div className="flex flex-col items-center gap-2">
            <QRCode value={record.token.token_value} size={168} />
            <span className="text-caption text-muted">Single use. A second scan is refused.</span>
          </div>
          <div className="flex min-w-[240px] flex-1 flex-col gap-4">
            <RecordHash
              hash={record.record_hash}
              caption="Proves nothing in this prescription has changed since it was signed"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" icon="download">Download PDF</Button>
              <Button variant="ghost" icon="phone">Send to the patient</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- suspended or not yet able to sign --------------------------------- */
  if (doctor && (doctor.is_suspended || !doctor.signing_key)) {
    return (
      <InlineNotice tone="scarlet" title="You cannot sign right now">
        {doctor.is_suspended
          ? 'Your account is suspended. Open Verification to read the reason and the evidence it cites.'
          : 'Finish setting up your account before writing prescriptions.'}
      </InlineNotice>
    );
  }

  async function unlock() {
    setUnlockError(null);
    try {
      await unlockSigning(passphrase);
      setPassphrase('');
      setPhase('ready');
    } catch (e) {
      setUnlockError(e instanceof Error ? e.message : 'That passphrase did not work.');
    }
  }

  /* ---- locked: unlock the key for this session --------------------------- */
  if (phase === 'locked') {
    return (
      <div className="flex flex-col gap-4">
        <InlineNotice tone="seal" title="Unlock your signing key">
          Your key is encrypted in this browser. Enter your passphrase once, and it stays unlocked until
          you close this tab or lock it from the header.
        </InlineNotice>

        <Field label="Signing passphrase" error={unlockError ?? undefined}>
          <Input
            type="password"
            autoComplete="current-password"
            value={passphrase}
            invalid={Boolean(unlockError)}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void unlock(); }}
          />
        </Field>

        <div>
          <Button icon="key" disabled={passphrase.length === 0} onClick={unlock}>Unlock</Button>
        </div>
      </div>
    );
  }

  /* ---- ready / holding / signing / error --------------------------------- */
  const holding = phase === 'holding';

  return (
    <div className="flex flex-col gap-4">
      <InlineNotice tone="neutral" title="Check this before you sign">
        Once sealed, this record is permanent. The medicine, the dose and the patient are all part of
        what your signature covers.
      </InlineNotice>

      {error ? (
        <InlineNotice tone="scarlet" title="Not sealed" role="alert">{error}</InlineNotice>
      ) : null}

      <div className="sticky-action">
        <button
          type="button"
          disabled={!valid || !canSign || phase === 'signing'}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onKeyDown={(e) => { if (e.key === ' ' && !holding) { e.preventDefault(); startHold(); } }}
          onKeyUp={(e) => { if (e.key === ' ') cancelHold(); }}
          aria-describedby="sign-hint"
          className={cn(
            'relative inline-flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden',
            'rounded-button bg-seal px-6 font-ui text-title-sm font-semibold text-qr-white shadow-primary',
            'transition-transform duration-instant ease-out active:scale-[0.98]',
            'disabled:opacity-[0.42] disabled:cursor-not-allowed disabled:active:scale-100 sm:w-auto',
          )}
        >
          {/* The fill is the progress indicator: it runs for exactly as long as
              the hold must last, so the animation is telling the truth. */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-qr-white/25 transition-[width] ease-linear"
            style={{ width: holding ? '100%' : '0%', transitionDuration: `${reduced ? DUR.quick : DUR.fill}ms` }}
          />
          <span className="relative flex items-center gap-2">
            {phase === 'signing' ? (
              <>
                <span aria-hidden className="spin size-4 rounded-full border-2 border-current border-r-transparent" />
                Sealing
              </>
            ) : (
              <>
                <Icon name="lock" size={18} />
                {holding ? 'Keep holding' : 'Hold to sign and seal'}
              </>
            )}
          </span>
        </button>

        <p id="sign-hint" className="mt-2 text-caption text-muted">
          Press and hold for a moment. Let go before it finishes and nothing is signed.
        </p>
      </div>
    </div>
  );
}
