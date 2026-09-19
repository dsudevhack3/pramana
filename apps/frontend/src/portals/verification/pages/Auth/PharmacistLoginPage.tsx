import { ROUTES } from '@/shared/constants/routes';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardBody, Field, InlineNotice, Input, SealMark } from '@pramana/ui-components';
import { isApiError } from '@pramana/api-client';
import type { Pharmacist } from '@pramana/types';
import { signIn } from '../../api/pharmacies.api';

/**
 * Flow 0.5, sign-in.
 *
 * Checking a prescription never needs an account, so this page makes that
 * obvious rather than trapping someone who only needs to verify something.
 */
export function PharmacistLoginPage({ onSignedIn }: { onSignedIn: (pharmacist: Pharmacist) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await signIn({ email, password }));
    } catch (e) {
      setError(
        isApiError(e) && e.code === 'pharmacy_not_approved'
          ? 'Your pharmacy has not been approved yet. You can still check prescriptions without signing in.'
          : 'That email and password do not match an account.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-[480px] flex-col justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <SealMark size={44} />
        <h1 className="text-title-lg">Sign in to dispense</h1>
        <p className="max-w-measure text-body-sm text-muted">
          You only need this to mark a prescription as dispensed. Checking whether one is genuine works
          without an account.
        </p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-5">
          <Field label="Work email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Password" htmlFor="password" error={error ?? undefined}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              invalid={Boolean(error)}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
            />
          </Field>

          <Button fullWidth disabled={!email || !password} loading={busy} loadingLabel="Signing in" onClick={submit}>
            Sign in
          </Button>
        </CardBody>
      </Card>

      <InlineNotice tone="neutral" title="No account yet?">
        <Link to={ROUTES.verification.register} className="underline">Register your pharmacy</Link> — a licence number, an
        address and a named pharmacist. A reviewer usually decides within a working day.
      </InlineNotice>

      <p className="text-center text-body-sm">
        <Link to={ROUTES.verification.verify} className="underline">Just checking a prescription?</Link>
      </p>
    </div>
  );
}
