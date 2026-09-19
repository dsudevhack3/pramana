import { useEffect, useState } from 'react';
import { Button, Field, Input, InlineNotice, Select, StatusRow, Badge } from '@pramana/ui-components';
import { isApiError } from '@pramana/api-client';
import type { LicenseVerification } from '@pramana/types';
import { listCouncils, verifyLicense } from '../../api/doctors.api';

/**
 * Flow 1, step 2.
 *
 * Three outcomes, three different screens - the point of this step is that a
 * partial match is NOT a failure and must not read like one. A married name,
 * an initial, a transposed date: all of those land in the review queue with a
 * human, and the copy here says so plainly instead of showing a red error.
 */
export function LicenseStep({
  aadhaarName,
  onDone,
}: {
  aadhaarName: string;
  onDone: (result: LicenseVerification) => void;
}) {
  const [councils, setCouncils] = useState<Array<{ code: string; name: string }>>([]);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [council, setCouncil] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LicenseVerification | null>(null);

  useEffect(() => {
    listCouncils().then(setCouncils).catch(() => setCouncils([]));
  }, []);

  async function check() {
    setBusy(true);
    setError(null);
    try {
      const verification = await verifyLicense({ license_number: licenseNumber.trim(), council_code: council });
      setResult(verification);
      if (verification.match_result === 'exact') onDone(verification);
    } catch (e) {
      setError(
        isApiError(e) && e.code === 'registry_unreachable'
          ? 'The council registry is not responding right now. Your details are saved; try this step again shortly.'
          : 'No registrant matches that number at the council you selected. Check both fields against your certificate.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (result?.match_result === 'partial') {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-title">A reviewer will finish this check</h2>
        <InlineNotice tone="amber" title="The names do not match closely enough to approve automatically">
          The registry lists <strong>{result.registrant_name}</strong>, and your Aadhaar says{' '}
          <strong>{aadhaarName}</strong>. That is common after a name change, and it is not a problem -
          a reviewer compares the two by hand.
        </InlineNotice>

        <div className="max-w-field">
          <StatusRow label="Licence number" value={result.license_number} mono />
          <StatusRow label="Council" value={result.council_name} />
          <StatusRow label="Name on the register" value={result.registrant_name} />
          <StatusRow label="Name on your Aadhaar" value={aadhaarName} />
          <StatusRow
            label="Outcome"
            value="Sent for manual review"
            status={<Badge status="pending" label="With a reviewer" />}
          />
        </div>

        <p className="max-w-measure text-body-sm text-muted">
          You can carry on with the remaining steps now. You will be able to sign prescriptions once the
          review clears, usually within one working day.
        </p>

        <Button onClick={() => onDone(result)}>Continue to clinic details</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-title">Verify your medical licence</h2>
        <p className="max-w-measure text-body-sm text-muted">
          We look your registration up in the council register and compare the name and date of birth
          there against the ones Aadhaar returned.
        </p>
      </div>

      <Field label="Issuing council" required>
        <Select value={council} onChange={(e) => setCouncil(e.target.value)}>
          <option value="">Select the council that registered you</option>
          {councils.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </Select>
      </Field>

      <Field
        label="Registration number"
        required
        help="Exactly as printed on your certificate, including any slashes."
        error={error ?? undefined}
      >
        <Input
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          placeholder="KMC/48213"
          invalid={Boolean(error)}
          className="font-mono"
        />
      </Field>

      <div>
        <Button
          disabled={!licenseNumber.trim() || !council}
          loading={busy}
          loadingLabel="Checking the council register"
          onClick={check}
        >
          Check my registration
        </Button>
      </div>
    </div>
  );
}
