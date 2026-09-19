import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge, Button, Card, CardBody, CardHeader, Field, InlineNotice, Input, RecordHash, SealMark, StatusRow, useToast,
} from '@pramana/ui-components';
import { assertEd25519Support, generateSigningKeyPair, hasKey, signPayload, storeKey } from '@pramana/crypto';
import { getMe, registerAdminKey, type AdminProfile } from '../../api/admin.api';
import { isAdminKeyUnlocked, lockAdminKey, unlockAdminKey } from '../../api/enforcement.api';

/**
 * The admin's own Ed25519 key, created and unlocked exactly like a doctor's -
 * same package, same passphrase wrapping, same IndexedDB vault.
 *
 * That symmetry is the point. An admin who can suspend a doctor is subject to
 * the same cryptographic accountability as the doctor: every decision they make
 * carries a signature only they can produce, and the chain makes it permanent.
 */
export function AdminKeySetupPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [keyOnDevice, setKeyOnDevice] = useState(false);
  const [unlocked, setUnlocked] = useState(isAdminKeyUnlocked());

  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(async (me) => {
        setProfile(me);
        setKeyOnDevice(await hasKey(me.id));
      })
      .catch(() => setError('Your profile could not be loaded.'));
  }, []);

  async function generate() {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      await assertEd25519Support();
      const pair = await generateSigningKeyPair();
      const proofPayload = { admin_id: profile.id, purpose: 'admin-key-registration', issued_at: new Date().toISOString() };
      const proof = await signPayload(pair.privateKey, proofPayload);

      await storeKey(profile.id, pair.privateKey, pair.publicKeyBase64Url, pair.fingerprint, passphrase);
      await registerAdminKey({
        public_key: pair.publicKeyBase64Url,
        fingerprint: pair.fingerprint,
        proof_signature: proof,
      });

      setKeyOnDevice(true);
      setPassphrase('');
      setConfirmation('');
      toast.show('Signing key created');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The key could not be created in this browser.');
    } finally {
      setBusy(false);
    }
  }

  async function unlock() {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      await unlockAdminKey(profile.id, passphrase);
      setUnlocked(true);
      setPassphrase('');
      toast.show('Signing key unlocked');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That passphrase did not work.');
    } finally {
      setBusy(false);
    }
  }

  const mismatch = confirmation.length > 0 && passphrase !== confirmation;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5">
      <header className="flex items-center gap-4">
        <SealMark size={40} />
        <div className="flex flex-col gap-1">
          <h1 className="text-title-lg">Your signing key</h1>
          <p className="max-w-measure text-body-sm text-muted">
            Every decision you record is signed with this key before it leaves your browser.
          </p>
        </div>
      </header>

      {error ? <InlineNotice tone="scarlet" title="Something went wrong" role="alert">{error}</InlineNotice> : null}

      <Card>
        <CardHeader
          title="Status"
          actions={
            <Badge
              status={unlocked ? 'verified' : keyOnDevice ? 'pending' : 'idle'}
              label={unlocked ? 'Unlocked' : keyOnDevice ? 'Locked' : 'Not set up'}
            />
          }
        />
        <CardBody className="flex flex-col gap-4">
          <StatusRow label="Admin" value={profile?.name ?? '—'} />
          <StatusRow
            label="Key on this device"
            value={keyOnDevice ? 'Yes, encrypted with your passphrase' : 'No key in this browser'}
          />
          {profile?.signing_key ? (
            <>
              <StatusRow label="Fingerprint" value={profile.signing_key.fingerprint} mono />
              <RecordHash
                hash={profile.signing_key.public_key}
                caption="Your public key. Decisions you sign are checked against this."
              />
            </>
          ) : null}
        </CardBody>
      </Card>

      {!keyOnDevice ? (
        <Card>
          <CardHeader
            title="Create a key"
            description="Generated here, encrypted with your passphrase, and stored in this browser only."
          />
          <CardBody className="flex flex-col gap-5">
            <Field label="Passphrase" required help="At least 12 characters. Entered once per session.">
              <Input type="password" autoComplete="new-password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
            </Field>
            <Field label="Type it again" required error={mismatch ? 'The two passphrases are different.' : undefined}>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmation}
                invalid={mismatch}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </Field>

            <InlineNotice tone="amber" title="Nobody can recover this for you">
              If you lose the passphrase you generate a new key. Decisions signed with the old one stay
              valid and verifiable - each entry records the key that signed it.
            </InlineNotice>

            <div>
              <Button
                variant="seal"
                sealJustification="generate-signing-key"
                icon="key"
                disabled={passphrase.length < 12 || mismatch}
                loading={busy}
                loadingLabel="Creating your key"
                onClick={generate}
              >
                Create my signing key
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : !unlocked ? (
        <Card>
          <CardHeader title="Unlock for this session" description="Needed before you can record any decision." />
          <CardBody className="flex flex-col gap-5">
            <Field label="Passphrase">
              <Input
                type="password"
                autoComplete="current-password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void unlock(); }}
              />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Button icon="key" disabled={!passphrase} loading={busy} loadingLabel="Unlocking" onClick={unlock}>
                Unlock
              </Button>
              <Button variant="ghost" onClick={() => navigate(ROUTES.admin.flagged)}>Continue read-only</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-measure text-body-sm">
              Your key is unlocked for this tab. It locks automatically when you close it.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" icon="lock" onClick={() => { lockAdminKey(); setUnlocked(false); }}>
                Lock now
              </Button>
              <Button onClick={() => navigate(ROUTES.admin.flagged)}>Go to the queue</Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
