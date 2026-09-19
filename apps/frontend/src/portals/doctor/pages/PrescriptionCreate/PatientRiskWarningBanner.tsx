import { InlineNotice } from '@pramana/ui-components';
import type { PatientRiskCheckResult } from '@pramana/types';

/**
 * Flow 5, patient branch, surfaced inside Flow 2.
 *
 * ADVISORY ONLY. This never blocks the sign button and it never offers an
 * override control, because there is nothing to override - the doctor is
 * already the decision-maker and this is context, not a gate. It mirrors how a
 * PDMP works: you cannot lock a patient out of healthcare, so the product does
 * not pretend it can.
 *
 * SS5: it is an InlineNotice rather than a Toast precisely because the doctor
 * must read it before proceeding.
 */
export function PatientRiskWarningBanner({ result }: { result: PatientRiskCheckResult | null }) {
  if (!result?.has_flags) return null;

  return (
    <InlineNotice
      tone="amber"
      title={result.flags.length === 1 ? 'One advisory flag on this patient' : `${result.flags.length} advisory flags on this patient`}
      role="status"
    >
      <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
        {result.flags.map((flag) => (
          <li key={flag.id}>
            {flag.detail}
            <span className="text-muted"> · raised {new Date(flag.raised_at).toLocaleDateString('en-IN')}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2">
        This is context from other prescribers, not a restriction. You are still the one deciding
        whether to write this prescription.
      </p>
    </InlineNotice>
  );
}
