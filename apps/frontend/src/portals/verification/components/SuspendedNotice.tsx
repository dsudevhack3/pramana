import { useEffect, useState } from 'react';
import { Button, InlineNotice, RecordHash, StatusRow } from '@pramana/ui-components';
import { getSuspensionDetail, type SuspensionDetail } from '../api/pharmacies.api';

/**
 * Flow 5 consequence for a pharmacy or pharmacist.
 *
 * When this renders, the scan-and-consume action is blocked. Verification
 * itself is NOT blocked - a suspended pharmacy can still look a prescription up
 * and see whether it is genuine, because withholding that would punish the
 * patient standing at the counter rather than the pharmacy.
 */
export function SuspendedNotice({ suspendedEntity }: { suspendedEntity: 'pharmacy' | 'pharmacist' }) {
  const [detail, setDetail] = useState<SuspensionDetail | null>(null);

  useEffect(() => {
    getSuspensionDetail().then(setDetail).catch(() => setDetail(null));
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-scarlet/40 bg-surface p-5">
      <InlineNotice
        tone="scarlet"
        title={suspendedEntity === 'pharmacy' ? 'This pharmacy is suspended' : 'Your account is suspended'}
        role="alert"
      >
        You can still check whether a prescription is genuine. You cannot mark one as dispensed until
        the suspension is lifted.
      </InlineNotice>

      {detail ? (
        <>
          <div>
            <StatusRow label="Reason given" value={detail.reason} />
            <StatusRow label="Rule cited" value={detail.cites_rule} />
            <StatusRow label="Decided by" value={detail.admin_name} />
            <StatusRow
              label="When"
              value={new Date(detail.created_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
            />
          </div>

          <RecordHash
            hash={detail.record_hash}
            caption="Proves this decision has not been altered since it was made"
          />

          <div><Button href={detail.appeal_url as never} icon="file">Contest this decision</Button></div>
        </>
      ) : null}
    </div>
  );
}
