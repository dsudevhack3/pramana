import { useState } from 'react';
import {
  Button, Field, Input, InlineNotice, RecordHash, SealMark,
} from '@pramana/ui-components';
import {
  assertEd25519Support, generateSigningKeyPair, signPayload, storeKey, verifyOwnSignature,
} from '@pramana/crypto';
import { registerPublicKey } from '../../api/doctors.api';

/**
 * Flow 1, step 4. (Added file - the provided structure names only the first
 * three onboarding steps, but key generation is the load-bearing one and does
 * not belong inline in the page component.)
 *
 * The private key is generated here, in this browser, wrapped with the doctor's
 * passphrase and written to IndexedDB. The server is sent the public half and a
 * proof signature - nothing else. The consequence of losing the passphrase is
 * stated before the key is made, not after.
 */
export function SigningKeyStep({ doctorId, onDone }: { doctorId: string; onDone: () => void }) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  const mismatch = confirmation.length > 0 && passphrase !== confirmation;
  const ready = passphrase.length >= 12 && !mismatch && acknowledged;

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      await assertEd25519Support();
      const pair = await generateSigningKeyPair();

      // Prove the pair round-trips before anything is stored or uploaded.
      const proofPayload = { doctor_id: doctorId, purpose: 'key-registration', issued_at: new Date().toISOString() };
      const proof = await signPayload(pair.privateKey, proofPayload);
      const valid = await verifyOwnSignature(pair.publicKeyRaw, proof, proofPayload);
      if (!valid) throw new Error('The key generated in this browser did not verify. Try again.');

      await storeKey(doctorId, pair.privateKey, pair.publicKeyBase64Url, pair.fingerprint, passphrase);
      await registerPublicKey({
        public_key: pair.publicKeyBase64Url,
        fingerprint: pair.fingerprint,
        proof_signature: proof,
      });

      setFingerprint(pair.fingerprint);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The key could not be created in this browser.');
    } finally {
      setBusy(false);
    }
  }

  if (fingerprint) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <SealMark size={64} mode="stamp" />
          <div className="flex flex-col gap-1">
            <h2 className="text-title">Your signing key is ready</h2>
            <p className="max-w-measure text-body-sm text-muted">
              From here, every prescription you write carries a signature only this key can produce.
            </p>
          </div>
        </div>

        <RecordHash hash={fingerprint.replace('ed25519:', '').replace(/\s/g, '')} caption="Your key's fingerprint. Compare it if you ever set this up on a second device." />

        <InlineNotice tone="amber" title="This key lives in this browser only">
          Clearing site data for this browser deletes it. If that happens, you generate a new key and
          carry on - old prescriptions stay valid, because each one records the key that signed it.
        </InlineNotice>

        <div><Button onClick={onDone}>Continue</Button></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-title">Create your signing key</h2>
        <p className="max-w-measure text-body-sm text-muted">
          This key is what makes a prescription yours. It is created on this device and never sent to us
          or to anyone else - we only ever hold the public half, which can check a signature but cannot
          make one.
        </p>
      </div>

      <Field
        label="Passphrase for this key"
        required
        help="At least 12 characters. You will type this once per session, before you sign."
      >
        <Input
          type="password"
          autoComplete="new-password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />
      </Field>

      <Field
        label="Type it again"
        required
        error={mismatch ? 'The two passphrases are different.' : undefined}
      >
        <Input
          type="password"
          autoComplete="new-password"
          value={confirmation}
          invalid={mismatch}
          onChange={(e) => setConfirmation(e.target.value)}
        />
      </Field>

      <label className="flex max-w-measure items-start gap-3 text-body-sm">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-1 size-4 accent-[var(--seal)]"
        />
        <span>
          I understand that nobody can recover this passphrase for me. If I forget it, I generate a new
          key rather than getting this one back.
        </span>
      </label>

      {error ? (
        <InlineNotice tone="scarlet" title="The key was not created" role="alert">{error}</InlineNotice>
      ) : null}

      <div>
        <Button
          variant="seal"
          sealJustification="generate-signing-key"
          icon="key"
          disabled={!ready}
          loading={busy}
          loadingLabel="Creating your key"
          onClick={generate}
        >
          Create my signing key
        </Button>
      </div>
    </div>
  );
}
