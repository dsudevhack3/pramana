import { useState } from 'react';
import { Button } from '../Button/Button';
import { Badge, type BadgeStatus } from '../Badge/Badge';
import { TrustTierBadge } from '../TrustTierBadge/TrustTierBadge';
import { Field, Input, Select, Textarea } from '../Input/Input';
import { OTPInput } from '../OTPInput/OTPInput';
import { StepperProgress } from '../StepperProgress/StepperProgress';
import { Modal } from '../Modal/Modal';
import { DataTable } from '../DataTable/DataTable';
import { StatusRow } from '../StatusRow/StatusRow';
import { SealMark } from '../SealMark/SealMark';
import { RecordHash } from '../RecordHash/RecordHash';
import { InlineNotice } from '../InlineNotice/InlineNotice';
import { ScanFrame } from '../ScanFrame/ScanFrame';
import { QRCode } from '../QRCode/QRCode';
import { Card, CardBody, CardHeader } from '../Card/Card';
import { useToast } from '../Toast/Toast';
import { useTheme } from '../lib/useTheme';

/**
 * SS5 requires a /kit route showing every component in every state, including
 * focus-visible, disabled, loading and error. It is both a build target and the
 * QA surface for the SS1 colour mapping and the SS8 accessibility floor.
 *
 * Mounted at /kit in all four apps from the shared router.
 */
const BADGES: BadgeStatus[] = ['verified', 'sealed', 'pending', 'expiring', 'rejected', 'suspended', 'idle'];

const STEPS = [
  { id: 'aadhaar', label: 'Identity', hint: 'Aadhaar eKYC with recorded consent' },
  { id: 'licence', label: 'Medical licence', hint: 'Matched against the council registry' },
  { id: 'clinic', label: 'Clinic', hint: 'Address and live geotagged photo' },
  { id: 'key', label: 'Signing key', hint: 'Generated in this browser' },
];

interface KitRow { id: string; name: string; rule: string; severity: 'high' | 'medium' | 'low' }

const ROWS: KitRow[] = [
  { id: 'FC-2291', name: 'Dr. Rohit Deshmukh', rule: 'Pharmacy concentration', severity: 'high' },
  { id: 'FC-2287', name: 'Farhan Ali', rule: 'Doctor shopping', severity: 'medium' },
  { id: 'FC-2265', name: 'Dr. Imran Qureshi', rule: 'Geo mismatch', severity: 'low' },
];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line-2 pt-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-title">{title}</h2>
        {note ? <p className="max-w-measure text-body-sm text-muted">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function KitPage() {
  const [otp, setOtp] = useState('');
  const [modal, setModal] = useState<'none' | 'default' | 'destructive'>('none');
  const [step, setStep] = useState(1);
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SealMark size={36} />
          <div>
            <h1 className="text-title-lg">Component kit</h1>
            <p className="max-w-measure text-body-sm text-muted">
              Every shared component in every state. If a screen needs something that is not here,
              extend a component on this page rather than writing a local one.
            </p>
          </div>
        </div>
        <Select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="max-w-[180px]"
          aria-label="Theme"
        >
          <option value="system">Match system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>
      </header>

      <Section title="Button" note="Ink is the primary action. Oxblood belongs to signing alone, and the type system will not let you use it anywhere else.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Ink, medium</Button>
          <Button size="sm">Ink, small</Button>
          <Button size="lg">Ink, large</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive" icon="ban">Suspend account</Button>
          <Button variant="seal" sealJustification="sign-prescription" icon="lock">Sign and seal</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled>Disabled</Button>
          <Button variant="ghost" disabled>Ghost, disabled</Button>
          <Button loading loadingLabel="Checking the registry">Verify licence</Button>
          <Button variant="seal" sealJustification="sign-prescription" loading loadingLabel="Sealing">
            Sign and seal
          </Button>
          <Button icon="chevronRight" iconPosition="trailing" onClick={() => toast.show('Saved')}>
            Show a toast
          </Button>
        </div>
      </Section>

      <Section title="Badge" note="Colour, icon and word together, always. Reading any of these in greyscale still tells you the state.">
        <div className="flex flex-wrap gap-2">
          {BADGES.map((s) => <Badge key={s} status={s} />)}
        </div>
      </Section>

      <Section title="TrustTierBadge" note="One component for every trust result in the product. These render instantly and never animate in.">
        <div className="flex flex-col gap-4">
          <TrustTierBadge tier={1} subtext="Verified by the Karnataka Medical Council and affiliated with Meridian Health Group at the time of signing." />
          <TrustTierBadge tier={2} />
          <TrustTierBadge tier={3} />
          <div className="flex flex-wrap gap-3">
            <TrustTierBadge tier={1} size="inline" />
            <TrustTierBadge tier={2} size="inline" />
            <TrustTierBadge tier={3} size="inline" />
          </div>
        </div>
      </Section>

      <Section title="Fields" note="Every field caps at 560px, keeps its label, and links its error through aria-describedby.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Medical licence number" help="As printed on the council certificate.">
            <Input placeholder="KMC/48213" />
          </Field>
          <Field label="Medical licence number" error="No registrant matches this number at the Karnataka Medical Council.">
            <Input defaultValue="KMC/4821" invalid />
          </Field>
          <Field label="Council" help="Pick the council that issued the registration.">
            <Select defaultValue="kmc">
              <option value="kmc">Karnataka Medical Council</option>
              <option value="mmc">Maharashtra Medical Council</option>
              <option value="tnmc">Tamil Nadu Medical Council</option>
            </Select>
          </Field>
          <Field label="Clinical notes" help="Optional. Visible to the dispensing pharmacist.">
            <Textarea placeholder="Take after food. Review in two weeks." />
          </Field>
          <Field label="Disabled field" help="Shown while a registry lookup is in flight.">
            <Input disabled defaultValue="Checking the registry" />
          </Field>
        </div>
      </Section>

      <Section title="OTPInput" note="Identical wherever an OTP appears, whatever is being verified.">
        <div className="grid gap-6 sm:grid-cols-2">
          <OTPInput value={otp} onChange={setOtp} onResend={() => {}} label="Code sent to the UIDAI-registered mobile" autoFocus={false} />
          <OTPInput value="1204" onChange={() => {}} error="That code has expired. Request a new one." label="Code sent to the patient" autoFocus={false} />
        </div>
      </Section>

      <Section title="StepperProgress" note="Discrete segments, never a percentage bar. Vertical in wide onboarding layouts, horizontal below.">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <StepperProgress steps={STEPS} current={step} orientation="vertical" />
          <div className="flex flex-col gap-4">
            <StepperProgress steps={STEPS} current={step} />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back a step</Button>
              <Button size="sm" onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}>Advance a step</Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Modal" note="The destructive variant keeps its confirm button disabled until a reason is typed.">
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => setModal('default')}>Open confirmation</Button>
          <Button variant="destructive" onClick={() => setModal('destructive')}>Open destructive</Button>
        </div>
        <Modal
          open={modal === 'default'}
          title="Send this invite?"
          confirmLabel="Send invite"
          onClose={() => setModal('none')}
          onConfirm={() => { setModal('none'); toast.show('Invite sent'); }}
        >
          Dr. Nambiar will be asked to accept. Accepting adds a display badge only, and never touches
          her signing key or licence status.
        </Modal>
        <Modal
          open={modal === 'destructive'}
          variant="destructive"
          title="Suspend Apex Chemists?"
          confirmLabel="Sign and suspend"
          onClose={() => setModal('none')}
          onConfirm={() => { setModal('none'); toast.show('Pharmacy suspended', 'ban'); }}
        >
          This blocks the pharmacy from scanning and consuming tokens immediately. The reason below is
          signed with your key and shown to them, so they can contest it.
        </Modal>
      </Section>

      <Section title="DataTable" note="A real sortable table above 1024px; the same rows as stacked cards below it. Resize the window to see the shape change.">
        <DataTable
          caption="Kit example rows"
          rows={ROWS}
          rowKey={(r) => r.id}
          severity={(r) => r.severity}
          filterText={(r) => `${r.id} ${r.name} ${r.rule}`}
          onRowActivate={(r) => toast.show(`Opened ${r.id}`)}
          columns={[
            { key: 'id', header: 'Reference', render: (r) => <span className="font-mono text-mono">{r.id}</span>, sortValue: (r) => r.id },
            { key: 'name', header: 'Subject', render: (r) => r.name, sortValue: (r) => r.name },
            { key: 'rule', header: 'Rule that fired', render: (r) => r.rule, sortValue: (r) => r.rule },
            { key: 'sev', header: 'Severity', render: (r) => <Badge status={r.severity === 'high' ? 'rejected' : r.severity === 'medium' ? 'pending' : 'idle'} label={r.severity} /> },
          ]}
        />
      </Section>

      <Section title="StatusRow, RecordHash, InlineNotice">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="What we verified" />
            <CardBody>
              <StatusRow label="Aadhaar" value="XXXX XXXX 4417" status={<Badge status="verified" />} />
              <StatusRow label="Medical licence" value="KMC/48213, Karnataka Medical Council" status={<Badge status="verified" />} />
              <StatusRow label="Clinic" value="Sunrise Clinic, Indiranagar, Bengaluru" status={<Badge status="pending" />} />
              <StatusRow label="Signing key" value="ed25519:9f4c 2a71 b0de 55c8" mono status={<Badge status="verified" label="On this device" />} />
            </CardBody>
          </Card>
          <div className="flex flex-col gap-4">
            <Card><CardBody>
              <RecordHash
                hash="4f2a91c7b0de55c83a71e2049fbc61d7a3e8850c214477bd6e0f9132ac5d78be"
                caption="Proves this record has not changed since it was signed"
              />
            </CardBody></Card>
            <InlineNotice tone="amber" title="Three controlled-substance prescriptions in 14 days">
              Written by three different prescribers. This is advisory only. You are still the one deciding.
            </InlineNotice>
            <InlineNotice tone="scarlet" title="This token has already been dispensed">
              Vaidya Medical Store consumed it on 17 September at 11:31. A second scan is refused and logged.
            </InlineNotice>
            <InlineNotice tone="tourmaline" title="Chain intact">
              41,207 links recomputed at 03:00 today. No break found.
            </InlineNotice>
            <InlineNotice tone="seal" title="Your signing key never leaves this device">
              It is encrypted with your passphrase in this browser. We hold only the public half.
            </InlineNotice>
          </div>
        </div>
      </Section>

      <Section title="SealMark, QRCode, ScanFrame">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card><CardBody className="flex flex-col items-center gap-4">
            <SealMark size={84} />
            <p className="text-caption text-muted">mode=&quot;mark&quot;</p>
            <SealMark size={84} mode="stamp" key={String(step)} />
            <p className="text-caption text-muted">mode=&quot;stamp&quot;, remounts to replay</p>
          </CardBody></Card>
          <Card><CardBody className="flex flex-col items-center gap-3">
            <QRCode value="PRM-4F2A-91C7" />
            <p className="text-caption text-muted">Black on white in both themes</p>
          </CardBody></Card>
          <Card><CardBody>
            <ScanFrame state="scanning" hint="Point the camera at the QR code." />
          </CardBody></Card>
        </div>
      </Section>
    </div>
  );
}
