import { ROUTES } from '@/shared/constants/routes';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, CardBody, CardHeader, InlineNotice, StatusRow, useToast } from '@pramana/ui-components';
import type { Pharmacist, PhotoVerificationResponse } from '@pramana/types';
import { verifyPrescriptionPhoto } from '../../api/photo-verification.api';
import { PhotoUploadError, PhotoUploadWidget } from '../../components/PhotoUploadWidget';

function riskBadgeStatus(level: string) {
  switch (level.toUpperCase()) {
    case 'VERIFIED':
    case 'LOW':
      return 'verified' as const;
    case 'HIGH':
    case 'SUSPICIOUS':
      return 'rejected' as const;
    case 'MEDIUM':
    case 'NEEDS_REVIEW':
      return 'pending' as const;
    default:
      return 'idle' as const;
  }
}

function checkLabel(value: boolean | null) {
  if (value === true) return 'Passed';
  if (value === false) return 'Failed';
  return 'Not available';
}

function checkBadge(value: boolean | null) {
  if (value === true) return <Badge status="verified" label="Passed" />;
  if (value === false) return <Badge status="rejected" label="Failed" />;
  return <Badge status="idle" label="Not available" />;
}

function formatProbability(value: number | null) {
  if (value === null) return 'Not available';
  return `${(value * 100).toFixed(2)}%`;
}

export function PhotoVerificationPage({ pharmacist }: { pharmacist: Pharmacist | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoVerificationResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function verify() {
    if (!file || !pharmacist || busy) return;

    setBusy(true);
    setResult(null);
    setUploadError(null);

    try {
      const response = await verifyPrescriptionPhoto(file);
      setResult(response);
      toast.show('Photo verification complete');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'The photo could not be verified.');
    } finally {
      setBusy(false);
    }
  }

  const ai = result?.ai_tampering_result ?? null;
  const forensic = result?.forensic_result ?? null;
  const text = result?.text_consistency_result ?? null;
  const layout = result?.layout_consistency_result ?? null;

  return (
    <div className="mx-auto flex max-w-content flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-title-lg">Prescription photo verification</h1>
            <p className="mt-1 max-w-measure text-body-sm text-muted">
              Upload a prescription image and review the platform match, OCR, forensic evidence, AI tampering signal, and consistency checks.
            </p>
          </div>
          <Link to={ROUTES.verification.verify} className="text-body-sm font-medium text-ink underline underline-offset-4">
            Back to QR/reference check
          </Link>
        </div>
      </header>

      {!pharmacist ? (
        <InlineNotice tone="amber" title="Sign in required">
          Photo verification is protected by the pharmacist session.{' '}
          <Link to={ROUTES.verification.signIn} className="font-medium underline underline-offset-4">Sign in</Link>{' '}
          before submitting a photo.
        </InlineNotice>
      ) : null}

      {uploadError ? <PhotoUploadError message={uploadError} /> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <PhotoUploadWidget
            file={file}
            disabled={busy}
            onFileChange={(nextFile, error) => {
              setFile(nextFile);
              setUploadError(error ?? null);
              setResult(null);
            }}
          />

          <Button
            fullWidth
            loading={busy}
            loadingLabel="Analyzing prescription photo"
            icon="shieldCheck"
            disabled={!file || !pharmacist}
            onClick={() => void verify()}
          >
            Verify this prescription photo
          </Button>

          <InlineNotice tone="neutral" title="How to read this result">
            A low tampering signal is only one signal. The final risk section combines the independent checks returned by the verification pipeline.
          </InlineNotice>
        </div>

        <div className="flex flex-col gap-5">
          {!result && !busy ? (
            <Card>
              <CardBody className="flex min-h-64 flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="text-ink-3">
                  <StatusRow label="Status" value="Waiting for an image" status={<Badge status="idle" label="Not started" />} />
                </span>
                <p className="max-w-measure text-body-sm text-muted">
                  The verification report will appear here after the backend finishes the analysis.
                </p>
              </CardBody>
            </Card>
          ) : null}

          {busy ? (
            <Card>
              <CardBody className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
                <span aria-hidden className="spin size-8 rounded-full border-2 border-ink border-r-transparent" />
                <div>
                  <p className="text-body font-medium">Analyzing the prescription image</p>
                  <p className="mt-1 text-body-sm text-muted">OCR, forensic checks, consistency analysis, and the local AI model are running.</p>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {result ? (
            <>
              <Card>
                <CardHeader
                  title="Final assessment"
                  description="This is the combined output returned by the backend verification pipeline."
                  actions={<Badge status={riskBadgeStatus(result.risk_level)} label={result.risk_level.replaceAll('_', ' ')} />}
                />
                <CardBody className="flex flex-col gap-1">
                  <StatusRow label="Verification case" value={result.verification_case.replaceAll('_', ' ')} />
                  <StatusRow label="Review status" value={result.review_status.replaceAll('_', ' ')} />
                  <StatusRow label="Matched prescription" value={result.matched_prescription_id ?? 'No platform record matched'} mono />
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Why this result was reached" />
                <CardBody>
                  {result.risk_reasons.length ? (
                    <ul className="m-0 flex flex-col gap-2 pl-5 text-body-sm">
                      {result.risk_reasons.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                  ) : (
                    <p className="text-body-sm text-muted">No additional reasons were returned.</p>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="OCR extraction" description="Text the backend extracted from the image." />
                <CardBody>
                  <StatusRow label="Doctor" value={result.ocr_result.doctor_name ?? 'Not detected'} />
                  <StatusRow label="Licence" value={result.ocr_result.license_number ?? 'Not detected'} mono />
                  <StatusRow label="Clinic" value={result.ocr_result.clinic_address ?? 'Not detected'} />
                  <StatusRow label="Patient" value={result.ocr_result.patient_name ?? 'Not detected'} />
                  <StatusRow label="Date" value={result.ocr_result.date ?? 'Not detected'} />
                  <StatusRow label="Medicines" value={result.ocr_result.drug_names.length ? result.ocr_result.drug_names.join(', ') : 'None detected'} />
                </CardBody>
              </Card>

              <div className="grid gap-5 xl:grid-cols-2">
                <Card>
                  <CardHeader title="AI tampering analysis" />
                  <CardBody>
                    <StatusRow label="Model" value={ai?.model_name ?? 'Not available'} />
                    <StatusRow label="Model status" value={ai?.model_available ? 'Available' : 'Unavailable'} status={<Badge status={ai?.model_available ? 'verified' : 'idle'} label={ai?.model_available ? 'Available' : 'Unavailable'} />} />
                    <StatusRow label="Tampering probability" value={formatProbability(ai?.probability ?? null)} mono />
                    <StatusRow label="Prediction" value={ai?.prediction ?? 'Not available'} />
                    {ai?.error ? <StatusRow label="AI error" value={ai.error} /> : null}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="External verification" />
                  <CardBody>
                    <StatusRow label="Doctor licence" value={checkLabel(result.license_check_passed)} status={checkBadge(result.license_check_passed)} />
                    <StatusRow label="Clinic address" value={checkLabel(result.clinic_check_passed)} status={checkBadge(result.clinic_check_passed)} />
                    <StatusRow label="Medicines" value={checkLabel(result.drug_check_passed)} status={checkBadge(result.drug_check_passed)} />
                  </CardBody>
                </Card>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <Card>
                  <CardHeader title="Forensic evidence" description="Traditional image and file-level signals." />
                  <CardBody>
                    <StatusRow label="Forensic score" value={forensic ? forensic.forensic_score.toFixed(3) : 'Not available'} mono />
                    <StatusRow label="ELA anomaly" value={forensic?.ela_anomaly_score === null || forensic?.ela_anomaly_score === undefined ? 'Not available' : forensic.ela_anomaly_score.toFixed(3)} mono />
                    <StatusRow label="Flags" value={forensic?.flags.length ? forensic.flags.join(' · ') : 'No forensic flags returned'} />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Consistency checks" />
                  <CardBody>
                    <StatusRow label="Text consistency" value={text ? `${text.score.toFixed(2)} · ${text.status}` : 'Not available'} status={<Badge status={text && text.score >= 0.6 ? 'verified' : 'pending'} label={text?.status ?? 'Not available'} />} />
                    <StatusRow label="Layout consistency" value={layout ? `${layout.score.toFixed(2)} · ${layout.status}` : 'Not available'} status={<Badge status={layout && layout.score >= 0.6 ? 'verified' : 'pending'} label={layout?.status ?? 'Not available'} />} />
                    <StatusRow label="Text flags" value={text?.flags.length ? text.flags.join(' · ') : 'None'} />
                    <StatusRow label="Layout flags" value={layout?.flags.length ? layout.flags.join(' · ') : 'None'} />
                  </CardBody>
                </Card>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
