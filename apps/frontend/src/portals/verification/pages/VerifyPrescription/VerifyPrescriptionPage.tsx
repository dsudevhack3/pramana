import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge, Button, Card, CardBody, CardHeader, Field, Icon, InlineNotice,
  Input, RecordHash, ScanFrame, StatusRow, useToast,
} from '@pramana/ui-components';
import type { Pharmacist, VerificationResult } from '@pramana/types';
import { consumeToken, resolvePrescription } from '../../api/verification.api';
import { TrustBadge } from '../../components/TrustBadge';
import { SuspendedNotice } from '../../components/SuspendedNotice';

/**
 * Flow 3. The screen the whole product exists to make fast.
 *
 * SS6: below 1024px the camera is full-bleed with the manual field under it;
 * from 1024px the camera becomes a fixed 420px panel beside a manual-entry
 * field of equal visual weight - never a webcam feed stretched across a monitor.
 *
 * SS8: the typed fallback is always present and always works. A denied camera
 * permission, a cracked lens or a crumpled QR must never be a dead end at a
 * counter with a queue behind it.
 *
 * SS7: the result renders instantly. Findings of fact do not fade in.
 */
export function VerifyPrescriptionPage({ pharmacist }: { pharmacist: Pharmacist | null }) {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'hit' | 'denied'>('idle');
  const [reference, setReference] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dispensed, setDispensed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<unknown>(null);
  const toast = useToast();

  const lookup = useCallback(async (input: { token?: string; reference?: string }) => {
    setBusy(true);
    setError(null);
    setDispensed(false);
    try {
      const found = await resolvePrescription(input);
      setResult(found);
      setToken(input.token ?? null);
    } catch {
      setResult(null);
      setError(
        'No prescription matches that. Check the reference against the printed copy, or scan the code again.',
      );
    } finally {
      setBusy(false);
    }
  }, []);

  /* BarcodeDetector where the browser has it; the typed field is the fallback
     everywhere else, which is why no polyfill is loaded. */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanState('scanning');

      const Detector = (window as unknown as { BarcodeDetector?: new (o: object) => { detect: (s: CanvasImageSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
      if (!Detector) return;
      detectorRef.current = new Detector({ formats: ['qr_code'] });

      const tick = async () => {
        if (!videoRef.current || scanStateRef.current !== 'scanning') return;
        try {
          const codes = await (detectorRef.current as { detect: (s: CanvasImageSource) => Promise<Array<{ rawValue: string }>> })
            .detect(videoRef.current);
          if (codes[0]?.rawValue) {
            setScanState('hit');
            navigator.vibrate?.(12);
            void lookup({ token: codes[0].rawValue });
            return;
          }
        } catch { /* a dropped frame is not an error worth surfacing */ }
        requestAnimationFrame(() => void tick());
      };
      void tick();
    } catch {
      setScanState('denied');
    }
  }, [lookup]);

  const scanStateRef = useRef(scanState);
  useEffect(() => { scanStateRef.current = scanState; }, [scanState]);

  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  async function markDispensed() {
    if (!token) return;
    setBusy(true);
    try {
      const outcome = await consumeToken({ token });
      if (outcome.reuse_blocked) {
        setError('This token was already used. The attempt has been logged.');
      } else {
        setDispensed(true);
        toast.show('Dispensed');
      }
    } finally {
      setBusy(false);
    }
  }

  const blocked = Boolean(pharmacist?.is_suspended);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Check a prescription</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Scan the code, or type the reference printed on the prescription. Either way you get the same
          answer.
        </p>
      </header>

      {blocked ? <SuspendedNotice suspendedEntity="pharmacist" /> : null}

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <ScanFrame
            videoRef={videoRef}
            state={scanState}
            hint="Hold the prescription so the square code fills the frame."
            fallback={<Button variant="ghost" icon="camera" onClick={startCamera}>Turn on the camera</Button>}
          />
          {scanState === 'idle' ? (
            <Button icon="scan" onClick={startCamera} fullWidth>Start scanning</Button>
          ) : null}

          <Card>
            <CardBody className="flex flex-col gap-4">
              <Field
                label="Or type the reference"
                help="Printed under the code, in the form PRM-0000-0000."
                error={error ?? undefined}
              >
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  placeholder="PRM-4F2A-91C7"
                  invalid={Boolean(error)}
                  className="font-mono"
                  onKeyDown={(e) => { if (e.key === 'Enter' && reference) void lookup({ reference }); }}
                />
              </Field>
              <Button
                disabled={reference.length < 8}
                loading={busy}
                loadingLabel="Checking the record"
                onClick={() => lookup({ reference })}
              >
                Check this reference
              </Button>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {!result && !busy ? (
            <Card>
              <CardBody className="flex flex-col items-center gap-3 py-9 text-center">
                <Icon name="scan" size={30} className="text-muted" />
                <p className="max-w-measure text-body-sm text-muted">
                  Scan or type a reference and the result appears here. Most checks take under three
                  seconds.
                </p>
              </CardBody>
            </Card>
          ) : null}

          {result ? (
            <>
              <TrustBadge trust={result.trust} />

              {result.token_already_consumed ? (
                <InlineNotice tone="scarlet" title="Already dispensed" role="alert">
                  This token was consumed on{' '}
                  {new Date(result.signed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.
                  Dispensing again would be a repeat, not a refill.
                </InlineNotice>
              ) : null}

              {!result.signature_valid || !result.chain_intact ? (
                <InlineNotice tone="scarlet" title="Do not dispense this" role="alert">
                  {!result.signature_valid
                    ? 'The signature on this record does not match the prescriber it names.'
                    : 'The record does not line up with the chain around it.'}{' '}
                  Keep the copy the patient handed you and report it.
                </InlineNotice>
              ) : null}

              <Card>
                <CardHeader
                  title="What was signed"
                  description="These details were fixed at the moment of signing and cannot have changed since."
                />
                <CardBody>
                  <StatusRow label="Reference" value={result.reference} mono />
                  <StatusRow label="Prescriber" value={result.doctor_name} />
                  <StatusRow
                    label="Licence status when signed"
                    value={result.doctor_license_status_at_signing}
                    status={<Badge status="verified" label="Recorded at signing" />}
                  />
                  <StatusRow
                    label="Signed"
                    value={new Date(result.signed_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                  />
                  {result.drugs.map((drug) => (
                    <StatusRow
                      key={drug.drug_code}
                      label="Medicine"
                      value={
                        <span className="font-document">
                          {drug.drug_name} — {drug.dosage_amount}{drug.dosage_unit}, {drug.frequency.toLowerCase()},
                          for {drug.duration_days} days. Dispense {drug.quantity}.
                        </span>
                      }
                      status={drug.is_controlled ? <Badge status="pending" label={drug.schedule} /> : undefined}
                    />
                  ))}
                  <StatusRow
                    label="Signature"
                    value={result.signature_valid ? 'Matches the prescriber on record' : 'Does not match'}
                    status={<Badge status={result.signature_valid ? 'verified' : 'rejected'} />}
                  />
                  <StatusRow
                    label="Chain"
                    value={result.chain_intact ? 'This record sits correctly in the chain' : 'Broken link detected'}
                    status={<Badge status={result.chain_intact ? 'verified' : 'rejected'} />}
                  />
                </CardBody>
              </Card>

              {result.lineage.length > 1 ? (
                <Card>
                  <CardHeader
                    title="This prescription was amended"
                    description="You are looking at the current version. The earlier ones are kept, not deleted."
                  />
                  <CardBody>
                    {result.lineage.map((entry, index) => (
                      <StatusRow
                        key={entry.reference}
                        label={index === 0 ? 'Current' : `Version ${result.lineage.length - index}`}
                        value={`${entry.reference} · ${new Date(entry.signed_at).toLocaleDateString('en-IN')}`}
                        status={<Badge status={entry.state === 'VOIDED' ? 'rejected' : 'sealed'} label={entry.state.toLowerCase()} />}
                      />
                    ))}
                  </CardBody>
                </Card>
              ) : null}

              {dispensed ? (
                <InlineNotice tone="tourmaline" title="Marked as dispensed">
                  The token is now consumed. Any further scan of it will be refused and logged.
                </InlineNotice>
              ) : (
                <div className="sticky bottom-4">
                  <Button
                    fullWidth
                    disabled={
                      blocked || !token || result.token_already_consumed ||
                      !result.signature_valid || !result.chain_intact || result.state === 'VOIDED'
                    }
                    loading={busy}
                    loadingLabel="Recording"
                    icon="check"
                    onClick={markDispensed}
                  >
                    I have dispensed this
                  </Button>
                  {!token ? (
                    <p className="mt-2 text-caption text-muted">
                      Scan the code to mark it dispensed. A typed reference checks the record but cannot
                      consume the token.
                    </p>
                  ) : null}
                </div>
              )}

              <RecordHash
                hash={result.reference}
                caption="Quote this reference if you need to report a problem with this prescription"
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
