import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge, Button, Card, CardBody, CardHeader, Field, Icon, InlineNotice,
  Input, OTPInput, SealMark, Select, StatusRow,
} from '@pramana/ui-components';
import type { DrugCatalogEntry, PatientRiskCheckResult, Prescription, PrescriptionPayload } from '@pramana/types';
import { useAuth } from '../../features/auth/useAuth';
import { checkPatientRisk, startPatientOtp, verifyPatientOtp } from '../../api/prescriptions.api';
import { DrugSearchInput } from './DrugSearchInput';
import { PatientRiskWarningBanner } from './PatientRiskWarningBanner';
import { SignAndSubmitPanel } from './SignAndSubmitPanel';

/**
 * Flow 2, end to end.
 *
 * SS6: above 1024px this is the "fill a form, see the result" two-pane layout -
 * the form on the left, a live, continuously-updating preview of the actual
 * prescription document on the right. Below that width the preview moves under
 * the form and the primary action sticks to the foot of the viewport.
 *
 * The preview is set in Spectral because it IS the document, not interface
 * chrome - that is what the typeface is for.
 */
const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 8 hours',
  'Every 12 hours',
  'At night',
  'As needed',
];

export function PrescriptionCreatePage() {
  const { doctor, canSign } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState({ name: '', phone: '', dob: '' });
  const [otpPhase, setOtpPhase] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [transactionId, setTransactionId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);

  const [drug, setDrug] = useState<DrugCatalogEntry | null>(null);
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const [risk, setRisk] = useState<PatientRiskCheckResult | null>(null);
  const [sealed, setSealed] = useState<Prescription | null>(null);

  /* Advisory patient check, run once identity is bound. Read-only by design. */
  useEffect(() => {
    if (otpPhase !== 'verified') return;
    const controller = new AbortController();
    checkPatientRisk({ phone: patient.phone, dob: patient.dob }, controller.signal)
      .then(setRisk)
      .catch(() => setRisk(null));
    return () => controller.abort();
  }, [otpPhase, patient.phone, patient.dob]);

  const dailyTotal = useMemo(() => {
    const perDose = Number(dosage);
    const perDay =
      frequency.includes('Twice') ? 2
      : frequency.includes('Three') ? 3
      : frequency.includes('Four') ? 4
      : frequency.includes('8 hours') ? 3
      : frequency.includes('12 hours') ? 2
      : 1;
    return Number.isFinite(perDose) ? perDose * perDay : 0;
  }, [dosage, frequency]);

  const doseWarning =
    drug && dailyTotal > 0 && dailyTotal > drug.safe_daily_max
      ? `That works out to ${dailyTotal}${drug.daily_unit}, above the ${drug.safe_daily_max}${drug.daily_unit} usually considered safe for this medicine.`
      : drug && dailyTotal > 0 && dailyTotal < drug.safe_daily_min
        ? `That works out to ${dailyTotal}${drug.daily_unit}, below the ${drug.safe_daily_min}${drug.daily_unit} usually considered effective.`
        : null;

  const payload: PrescriptionPayload | null =
    doctor && drug && otpPhase === 'verified' && dosage && frequency && durationDays && quantity
      ? {
          doctor_id: doctor.id,
          patient: { ...patient, otp_verified: true },
          drugs: [
            {
              drug_code: drug.drug_code,
              drug_name: drug.drug_name,
              form: drug.form,
              schedule: drug.schedule,
              strength: drug.strength,
              dosage_amount: Number(dosage),
              dosage_unit: drug.daily_unit.replace('/day', ''),
              frequency,
              duration_days: Number(durationDays),
              quantity: Number(quantity),
              is_controlled: drug.is_controlled,
            },
          ],
          notes: notes.trim() || null,
          issued_at: new Date().toISOString(),
        }
      : null;

  async function sendOtp() {
    setOtpBusy(true);
    setOtpError(null);
    try {
      const result = await startPatientOtp(patient);
      setTransactionId(result.transaction_id);
      setOtpPhase('sent');
    } catch {
      setOtpError('We could not send a code to that number. Check it and try again.');
    } finally {
      setOtpBusy(false);
    }
  }

  async function confirmOtp(code: string) {
    setOtpBusy(true);
    setOtpError(null);
    try {
      await verifyPatientOtp({ transaction_id: transactionId, otp: code });
      setOtpPhase('verified');
    } catch {
      setOtpError('That code did not match. Ask the patient to read it out again.');
      setOtp('');
    } finally {
      setOtpBusy(false);
    }
  }

  const patientReady = patient.name.trim().length > 1 && /^[6-9]\d{9}$/.test(patient.phone.replace(/\D/g, '')) && patient.dob;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-title-lg">New prescription</h1>
          <p className="max-w-measure text-body-sm text-muted">
            Bind the patient, choose the medicine, then sign. Nothing is stored until you seal it.
          </p>
        </div>
        {sealed ? (
          <Button variant="ghost" icon="plus" onClick={() => window.location.reload()}>
            Write another
          </Button>
        ) : null}
      </header>

      {!canSign && !sealed ? (
        <InlineNotice tone="amber" title="Finish your set-up before writing prescriptions">
          Your identity, licence, clinic and signing key all need to be in place.{' '}
          <button type="button" className="underline" onClick={() => navigate(ROUTES.doctor.onboarding)}>
            Open set-up
          </button>
        </InlineNotice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-start">
        {/* ---------------- form pane ---------------- */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader
              title="Patient"
              description="The prescription is bound to this person once they enter the code sent to their phone."
              actions={otpPhase === 'verified' ? <Badge status="verified" label="Identity bound" /> : null}
            />
            <CardBody className="flex flex-col gap-5">
              <Field label="Full name" required>
                <Input
                  value={patient.name}
                  disabled={otpPhase === 'verified'}
                  onChange={(e) => setPatient((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Vikram Shetty"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Mobile number" required help="The code goes here.">
                  <Input
                    value={patient.phone}
                    inputMode="numeric"
                    disabled={otpPhase === 'verified'}
                    onChange={(e) => setPatient((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="98861 04417"
                    className="font-mono"
                  />
                </Field>
                <Field label="Date of birth" required>
                  <Input
                    type="date"
                    value={patient.dob}
                    disabled={otpPhase === 'verified'}
                    onChange={(e) => setPatient((p) => ({ ...p, dob: e.target.value }))}
                  />
                </Field>
              </div>

              {otpPhase === 'idle' ? (
                <div>
                  <Button disabled={!patientReady} loading={otpBusy} loadingLabel="Sending the code" onClick={sendOtp}>
                    Send the patient a code
                  </Button>
                  {otpError ? <p className="mt-2 text-caption text-scarlet">{otpError}</p> : null}
                </div>
              ) : null}

              {otpPhase === 'sent' ? (
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={confirmOtp}
                  onResend={sendOtp}
                  disabled={otpBusy}
                  label="Code the patient received"
                  error={otpError ?? undefined}
                />
              ) : null}

              {otpPhase === 'verified' ? (
                <Button variant="ghost" size="sm" onClick={() => { setOtpPhase('idle'); setOtp(''); setRisk(null); }}>
                  This is a different patient
                </Button>
              ) : null}
            </CardBody>
          </Card>

          <PatientRiskWarningBanner result={risk} />

          <Card>
            <CardHeader title="Medicine" description="One medicine per prescription keeps each token independently dispensable." />
            <CardBody className="flex flex-col gap-5">
              <DrugSearchInput selected={drug} onSelect={setDrug} />

              {drug ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label={`Dose per administration (${drug.daily_unit.replace('/day', '')})`}
                      required
                      error={doseWarning ?? undefined}
                    >
                      <Input
                        value={dosage}
                        inputMode="decimal"
                        invalid={Boolean(doseWarning)}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="625"
                      />
                    </Field>
                    <Field label="How often" required>
                      <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                        <option value="">Choose a frequency</option>
                        {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                      </Select>
                    </Field>
                    <Field label="For how many days" required>
                      <Input
                        value={durationDays}
                        inputMode="numeric"
                        onChange={(e) => setDurationDays(e.target.value)}
                        placeholder="5"
                      />
                    </Field>
                    <Field label="Total quantity to dispense" required help="What the pharmacist hands over.">
                      <Input
                        value={quantity}
                        inputMode="numeric"
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="10"
                      />
                    </Field>
                  </div>

                  <Field label="Notes for the patient or pharmacist" help="Optional. Printed on the prescription.">
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Take after food. Review in two weeks." />
                  </Field>

                  {drug.is_controlled ? (
                    <InlineNotice tone="amber" title="This is a controlled medicine">
                      {drug.schedule}. This prescription will be included in the automated checks that
                      look for patterns across prescribers and pharmacies.
                    </InlineNotice>
                  ) : null}
                </>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Sign and seal" />
            <CardBody>
              <SignAndSubmitPanel payload={payload} valid={Boolean(payload)} onSealed={setSealed} />
            </CardBody>
          </Card>
        </div>

        {/* ---------------- live preview pane ---------------- */}
        <aside className="lg:sticky lg:top-[88px]">
          <Card>
            <CardHeader title="What the pharmacist will see" />
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3 border-b border-line-2 pb-4">
                <div className="flex flex-col gap-1">
                  <span className="font-document text-title-sm">{doctor?.name ?? 'Your name'}</span>
                  <span className="text-caption text-muted">
                    {doctor?.license?.license_number ?? 'Licence pending'} · {doctor?.license?.council_name ?? ''}
                  </span>
                  {doctor?.organization_name ? (
                    <span className="text-caption text-muted">{doctor.organization_name}</span>
                  ) : (
                    <span className="text-caption text-muted">Independent practice</span>
                  )}
                </div>
                <SealMark size={34} />
              </div>

              <div className="flex flex-col font-document">
                <StatusRow label="Patient" value={patient.name || <span className="text-muted">Not entered yet</span>} />
                <StatusRow
                  label="Medicine"
                  value={drug ? `${drug.drug_name}` : <span className="text-muted">Not chosen yet</span>}
                />
                <StatusRow
                  label="Directions"
                  value={
                    dosage && frequency && durationDays
                      ? `${dosage}${drug?.daily_unit.replace('/day', '') ?? ''}, ${frequency.toLowerCase()}, for ${durationDays} days`
                      : <span className="text-muted">Not complete yet</span>
                  }
                />
                <StatusRow label="Quantity" value={quantity || <span className="text-muted">—</span>} />
                {notes ? <StatusRow label="Notes" value={notes} /> : null}
              </div>

              <div className="flex items-center gap-3 rounded-control bg-canvas-2 p-3 text-caption text-muted">
                <Icon name="shieldCheck" size={18} />
                <span>
                  Your licence status is recorded onto this record at the moment you sign, and stays
                  frozen there. A later change never rewrites what this prescription says.
                </span>
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
