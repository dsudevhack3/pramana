import { useState } from 'react';
import { Button, Field, Input, InlineNotice, OTPInput } from '@pramana/ui-components';
import { isApiError } from '@pramana/api-client';
import type { Doctor } from '@pramana/types';
import { startAadhaarVerification, verifyAadhaarOtp } from '../../api/doctors.api';

/**
 * Flow 1, step 1.
 *
 * Consent is a screen, not a checkbox buried in a form: the doctor reads what
 * is sent, what comes back and what we keep, then agrees. The consent
 * timestamp is what makes the eKYC lawful, so it is captured as its own
 * deliberate action before any OTP is requested.
 */
export function AadhaarStep({ onDone }: { onDone: (doctor: Doctor) => void }) {
  const [phase, setPhase] = useState<'consent' | 'number' | 'otp'>('consent');
  const [aadhaar, setAadhaar] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = aadhaar.replace(/\D/g, '');
  const aadhaarValid = digits.length === 12;

  async function requestOtp() {
    setBusy(true);
    setError(null);
    try {
      const result = await startAadhaarVerification({ aadhaar_number: digits, consent: true });
      setTransactionId(result.transaction_id);
      setSentTo(result.otp_sent_to);
      setPhase('otp');
    } catch (e) {
      setError(
        isApiError(e)
          ? (e.fieldError('aadhaar_number') ?? e.message)
          : 'The identity service did not respond. Try again in a moment.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(code: string) {
    setBusy(true);
    setError(null);
    try {
      onDone(await verifyAadhaarOtp({ transaction_id: transactionId, otp: code }));
    } catch (e) {
      setError(isApiError(e) ? e.message : 'That code was not accepted. Request a new one.');
      setOtp('');
    } finally {
      setBusy(false);
    }
  }

  if (phase === 'consent') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-title">Confirm your identity with Aadhaar</h2>
          <p className="max-w-measure text-body-sm text-muted">
            This is the root of everything else. Your licence, your clinic and your signing key are all
            tied back to the person this check confirms you are.
          </p>
        </div>

        <InlineNotice tone="seal" title="What happens, exactly">
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-4">
            <li>We send your Aadhaar number to a UIDAI-licensed provider to request a one-time password.</li>
            <li>UIDAI sends that password to the mobile number registered against your Aadhaar.</li>
            <li>The provider returns your name, date of birth and address to us.</li>
            <li>
              We keep only the masked number and the provider&apos;s reference token. Your full Aadhaar
              number is never written to our database.
            </li>
          </ul>
        </InlineNotice>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setPhase('number')}>I agree, continue</Button>
          <Button variant="ghost" onClick={() => window.history.back()}>Not now</Button>
        </div>
      </div>
    );
  }

  if (phase === 'number') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-title">Enter your Aadhaar number</h2>
          <p className="max-w-measure text-body-sm text-muted">
            Twelve digits. You agreed to this check at {new Date().toLocaleTimeString('en-IN')}, and that
            timestamp is stored with the request.
          </p>
        </div>

        <Field
          label="Aadhaar number"
          required
          help="Spaces are fine. We show it grouped so it is easy to check against your card."
          error={error ?? undefined}
        >
          <Input
            value={aadhaar}
            inputMode="numeric"
            autoComplete="off"
            placeholder="1234 5678 9012"
            maxLength={14}
            invalid={Boolean(error)}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
              setAadhaar(raw.replace(/(.{4})/g, '$1 ').trim());
            }}
            className="font-mono"
          />
        </Field>

        <div>
          <Button disabled={!aadhaarValid} loading={busy} loadingLabel="Requesting a code" onClick={requestOtp}>
            Send me a code
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-title">Enter the code UIDAI sent you</h2>
        <p className="max-w-measure text-body-sm text-muted">
          Sent to the mobile number registered against your Aadhaar, ending {sentTo}. If that number is
          out of date, update it at an Aadhaar centre before continuing.
        </p>
      </div>

      <OTPInput
        value={otp}
        onChange={setOtp}
        onComplete={submitOtp}
        onResend={requestOtp}
        disabled={busy}
        label="One-time password"
        error={error ?? undefined}
      />

      <Button variant="ghost" onClick={() => { setPhase('number'); setError(null); }}>
        Use a different Aadhaar number
      </Button>
    </div>
  );
}
