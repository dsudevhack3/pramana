import { ROUTES } from '@/shared/constants/routes';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge, Button, Card, CardBody, Field, InlineNotice, Input, StatusRow, StepperProgress,
} from '@pramana/ui-components';
import type { Step } from '@pramana/ui-components';
import { onboardPharmacy, verifyPharmacyAddress } from '../../api/pharmacies.api';

/**
 * Flow 0.5.
 *
 * Intentionally lighter than doctor onboarding: no Aadhaar eKYC, no geotagged
 * photo. A pharmacist consumes trust records rather than creating them, so the
 * bar is registration plus admin approval.
 *
 * The reason this flow exists at all is enforcement: a pharmacist needs a real
 * account before a pharmacist can be suspended. The copy says so, because a
 * registration step with no obvious benefit to the person filling it in reads
 * as bureaucracy unless you explain it.
 */
const STEPS: Step[] = [
  { id: 'pharmacy', label: 'Pharmacy', hint: 'Licence number and address' },
  { id: 'person', label: 'Pharmacist', hint: 'Who will be scanning at the counter' },
  { id: 'review', label: 'Approval', hint: 'A platform reviewer checks the registration' },
];

export function PharmacyOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    pharmacy_name: '',
    license_number: '',
    council_name: '',
    address_text: '',
    pharmacist_name: '',
    pharmacist_email: '',
    pharmacist_phone: '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function checkAddress() {
    setBusy(true);
    setError(null);
    try {
      const result = await verifyPharmacyAddress({ address_text: form.address_text });
      if (!result.maps_confirmed) {
        setError('We could not find that address. Add the area or a landmark and try again.');
        return;
      }
      setResolvedAddress(result.formatted_address ?? form.address_text);
      setStep(1);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onboardPharmacy({
        pharmacy_name: form.pharmacy_name,
        license_number: form.license_number,
        council_name: form.council_name,
        address: {
          line1: resolvedAddress ?? form.address_text,
          city: '', state: '', pincode: '',
        },
        pharmacist_name: form.pharmacist_name,
        pharmacist_email: form.pharmacist_email,
        pharmacist_phone: form.pharmacist_phone,
      });
      setSubmitted(true);
      setStep(2);
    } catch {
      setError('The registration did not go through. Check the licence number and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-content flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Register your pharmacy</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Two short forms and a review. After that, anyone at your counter can check a prescription and
          mark it dispensed.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-6">
          <StepperProgress
            steps={STEPS}
            current={step}
            orientation={typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'vertical' : 'horizontal'}
            label="Registration progress"
          />
        </div>

        <Card>
          <CardBody className="flex flex-col gap-5 p-5">
            {step === 0 ? (
              <>
                <h2 className="text-title">About the pharmacy</h2>

                <Field label="Pharmacy name" required>
                  <Input value={form.pharmacy_name} onChange={set('pharmacy_name')} placeholder="Vaidya Medical Store" />
                </Field>

                <Field label="State pharmacy council" required help="The council that issued your retail licence.">
                  <Input value={form.council_name} onChange={set('council_name')} placeholder="Karnataka State Pharmacy Council" />
                </Field>

                <Field label="Pharmacy licence number" required>
                  <Input
                    value={form.license_number}
                    onChange={set('license_number')}
                    placeholder="KA/BLR/RP/19842"
                    className="font-mono"
                  />
                </Field>

                <Field
                  label="Pharmacy address"
                  required
                  help="We confirm the address exists. We do not ask anyone to photograph it."
                  error={error ?? undefined}
                >
                  <Input value={form.address_text} onChange={set('address_text')} placeholder="38, 4th Block, Jayanagar, Bengaluru 560011" />
                </Field>

                <div>
                  <Button
                    disabled={!form.pharmacy_name || !form.license_number || form.address_text.length < 12}
                    loading={busy}
                    loadingLabel="Finding the address"
                    onClick={checkAddress}
                  >
                    Continue
                  </Button>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <h2 className="text-title">Who will be scanning?</h2>
                <InlineNotice tone="neutral" title="Why we ask for a named person">
                  Scanning is an action with consequences, so it belongs to someone rather than to a
                  terminal. It also means that if something goes wrong, the response is aimed at one
                  account rather than at your whole counter.
                </InlineNotice>

                {resolvedAddress ? (
                  <div className="max-w-field">
                    <StatusRow label="Address confirmed" value={resolvedAddress} status={<Badge status="verified" label="Found" />} />
                  </div>
                ) : null}

                <Field label="Pharmacist's full name" required>
                  <Input value={form.pharmacist_name} onChange={set('pharmacist_name')} placeholder="Sandeep Vaidya" />
                </Field>
                <Field label="Work email" required help="Sign-in details and the approval decision go here.">
                  <Input type="email" value={form.pharmacist_email} onChange={set('pharmacist_email')} />
                </Field>
                <Field label="Mobile number" required>
                  <Input value={form.pharmacist_phone} onChange={set('pharmacist_phone')} inputMode="numeric" className="font-mono" />
                </Field>

                {error ? <InlineNotice tone="scarlet" title="Not submitted" role="alert">{error}</InlineNotice> : null}

                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                  <Button
                    disabled={!form.pharmacist_name || !form.pharmacist_email}
                    loading={busy}
                    loadingLabel="Sending for review"
                    onClick={submit}
                  >
                    Send for approval
                  </Button>
                </div>
              </>
            ) : null}

            {step === 2 && submitted ? (
              <>
                <h2 className="text-title">Sent for approval</h2>
                <InlineNotice tone="tourmaline" title="A reviewer has your registration">
                  You will get an email at {form.pharmacist_email} when it is decided, usually within a
                  working day. Nothing else is needed from you now.
                </InlineNotice>

                <div className="max-w-field">
                  <StatusRow label="Pharmacy" value={form.pharmacy_name} status={<Badge status="pending" />} />
                  <StatusRow label="Licence" value={form.license_number} mono />
                  <StatusRow label="Address" value={resolvedAddress ?? form.address_text} />
                </div>

                <p className="max-w-measure text-body-sm text-muted">
                  In the meantime you can still check whether a prescription is genuine - that never
                  needs an account. Marking one as dispensed does.
                </p>

                <div><Button onClick={() => navigate(ROUTES.verification.verify)}>Check a prescription</Button></div>
              </>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
