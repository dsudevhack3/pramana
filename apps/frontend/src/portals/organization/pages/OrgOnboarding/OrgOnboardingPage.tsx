import { useState } from 'react';
import {
  Badge, Button, Card, CardBody, Field, InlineNotice, Input, Select, StatusRow, StepperProgress,
} from '@pramana/ui-components';
import type { Step } from '@pramana/ui-components';
import { onboardOrganization, registryLookup, verifyOrgAddress } from '../../api/organizations.api';

/**
 * Flow 0.
 *
 * The screen states plainly what verification does and does not confer, because
 * this is the single most consequential misunderstanding in the whole product:
 * a verified organisation does NOT mean its doctors are verified. Every doctor
 * still completes Flow 1 on their own.
 */
const STEPS: Step[] = [
  { id: 'registry', label: 'Registration', hint: 'CIN, GST or Shop Act number' },
  { id: 'address', label: 'Address', hint: 'Confirmed against the map' },
  { id: 'admin', label: 'Administrator', hint: 'Who manages the roster' },
  { id: 'review', label: 'Review', hint: 'A platform reviewer checks the submission' },
];

export function OrgOnboardingPage() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalName, setLegalName] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  const [form, setForm] = useState({
    registration_type: 'CIN' as 'CIN' | 'GST' | 'SHOP_ACT',
    registration_number: '',
    gst_number: '',
    name: '',
    address_text: '',
    admin_name: '',
    admin_email: '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function lookup() {
    setBusy(true);
    setError(null);
    try {
      const result = await registryLookup({
        registration_number: form.registration_number.trim(),
        registration_type: form.registration_type,
      });
      if (!result.found) {
        setError('No company matches that number in the registry. Check it against your certificate of incorporation.');
        return;
      }
      setLegalName(result.legal_name);
      setForm((f) => ({ ...f, name: result.legal_name ?? f.name }));
      setStep(1);
    } finally {
      setBusy(false);
    }
  }

  async function checkAddress() {
    setBusy(true);
    setError(null);
    try {
      const result = await verifyOrgAddress({ address_text: form.address_text });
      if (!result.maps_confirmed) {
        setError('We could not find that address. Add the area or a landmark and try again.');
        return;
      }
      setResolvedAddress(result.formatted_address ?? form.address_text);
      setStep(2);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onboardOrganization({
        name: form.name,
        registration_number: form.registration_number,
        registration_type: form.registration_type,
        gst_number: form.gst_number || null,
        address: { line1: resolvedAddress ?? form.address_text, city: '', state: '', pincode: '' },
        admin_name: form.admin_name,
        admin_email: form.admin_email,
      });
      setStep(3);
    } catch {
      setError('The submission did not go through. Check the details and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-content flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Register your organisation</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Verification lets your name appear on prescriptions your doctors sign. It does not verify the
          doctors themselves — each of them does that individually.
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
                <h2 className="text-title">Your registration number</h2>

                <Field label="Registration type" required>
                  <Select value={form.registration_type} onChange={set('registration_type')}>
                    <option value="CIN">Corporate Identity Number (CIN)</option>
                    <option value="GST">GST registration</option>
                    <option value="SHOP_ACT">Shop and Establishment registration</option>
                  </Select>
                </Field>

                <Field label="Registration number" required error={error ?? undefined}>
                  <Input
                    value={form.registration_number}
                    onChange={set('registration_number')}
                    placeholder="U85110KA2016PTC091234"
                    className="font-mono"
                  />
                </Field>

                <Field label="GST number" help="Optional, but it speeds the review up.">
                  <Input value={form.gst_number} onChange={set('gst_number')} className="font-mono" />
                </Field>

                <div>
                  <Button
                    disabled={form.registration_number.trim().length < 6}
                    loading={busy}
                    loadingLabel="Checking the registry"
                    onClick={lookup}
                  >
                    Look this up
                  </Button>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <h2 className="text-title">Where are you based?</h2>

                {legalName ? (
                  <div className="max-w-field">
                    <StatusRow label="Found in the registry" value={legalName} status={<Badge status="verified" label="Matched" />} />
                  </div>
                ) : null}

                <Field label="Display name" required help="What patients and pharmacists see. Usually your trading name.">
                  <Input value={form.name} onChange={set('name')} />
                </Field>

                <Field label="Registered address" required error={error ?? undefined}>
                  <Input
                    value={form.address_text}
                    onChange={set('address_text')}
                    placeholder="Meridian Health Group, 7 Residency Road, Bengaluru 560025"
                  />
                </Field>

                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                  <Button
                    disabled={form.address_text.trim().length < 12 || !form.name}
                    loading={busy}
                    loadingLabel="Finding the address"
                    onClick={checkAddress}
                  >
                    Continue
                  </Button>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <h2 className="text-title">Who manages the roster?</h2>

                <InlineNotice tone="neutral" title="What this administrator can and cannot do">
                  They can invite doctors, remove an affiliation and read aggregate figures. They cannot
                  verify a doctor, change anyone&apos;s licence status, or sign a prescription on a
                  doctor&apos;s behalf — that last one is not possible for anyone, including us.
                </InlineNotice>

                {resolvedAddress ? (
                  <div className="max-w-field">
                    <StatusRow label="Address confirmed" value={resolvedAddress} status={<Badge status="verified" label="Found" />} />
                  </div>
                ) : null}

                <Field label="Administrator's name" required>
                  <Input value={form.admin_name} onChange={set('admin_name')} />
                </Field>
                <Field label="Work email" required>
                  <Input type="email" value={form.admin_email} onChange={set('admin_email')} />
                </Field>

                {error ? <InlineNotice tone="scarlet" title="Not submitted" role="alert">{error}</InlineNotice> : null}

                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button
                    disabled={!form.admin_name || !form.admin_email}
                    loading={busy}
                    loadingLabel="Sending for review"
                    onClick={submit}
                  >
                    Send for review
                  </Button>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <h2 className="text-title">Sent for review</h2>
                <InlineNotice tone="tourmaline" title="A reviewer has your submission">
                  You will hear at {form.admin_email} once it is decided. You can invite doctors as soon
                  as it clears.
                </InlineNotice>

                <div className="max-w-field">
                  <StatusRow label="Organisation" value={form.name} status={<Badge status="pending" />} />
                  <StatusRow label="Registration" value={form.registration_number} mono />
                  <StatusRow label="Address" value={resolvedAddress ?? form.address_text} />
                </div>

                <InlineNotice tone="seal" title="One thing worth repeating">
                  Verifying your organisation does not verify your doctors. Each of them completes their
                  own identity, licence, clinic and key set-up, and that is what a pharmacist actually
                  checks.
                </InlineNotice>
              </>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
