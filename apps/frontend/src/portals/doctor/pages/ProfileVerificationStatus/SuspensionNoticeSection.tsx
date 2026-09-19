import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, InlineNotice, RecordHash, StatusRow } from '@pramana/ui-components';
import { getSuspensionNotice, type SuspensionNotice } from '../../api/doctors.api';

/**
 * The Flow 5 consequence, seen from the other side.
 *
 * The whole point of signing and hash-chaining enforcement actions is that a
 * suspended doctor gets the exact reason, the rule it cites and the evidence
 * behind it - not a black-box ban. That is what makes an appeal possible, so
 * this section shows all of it rather than a generic "contact support".
 */
export function SuspensionNoticeSection({ suspended }: { suspended: boolean }) {
  const [notice, setNotice] = useState<SuspensionNotice | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!suspended) return;
    getSuspensionNotice().then(setNotice).catch(() => setFailed(true));
  }, [suspended]);

  if (!suspended) return null;

  return (
    <Card className="border-scarlet/40">
      <CardHeader
        title="Your account is suspended"
        description="You cannot sign new prescriptions. Everything you signed before this stays valid and dispensable."
      />
      <CardBody className="flex flex-col gap-5">
        {failed ? (
          <InlineNotice tone="amber" title="The notice did not load" role="alert">
            Reload the page. If it keeps failing, quote your account email when you contact the
            platform team.
          </InlineNotice>
        ) : null}

        {notice ? (
          <>
            <InlineNotice tone="scarlet" title="Reason given">
              {notice.reason}
            </InlineNotice>

            <div>
              <StatusRow label="Rule cited" value={notice.cites_rule} />
              {notice.cites_candidate_reference ? (
                <StatusRow label="Evidence reference" value={notice.cites_candidate_reference} mono />
              ) : null}
              <StatusRow label="Decided by" value={notice.admin_name} />
              <StatusRow
                label="When"
                value={new Date(notice.created_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
              />
            </div>

            <RecordHash
              hash={notice.record_hash}
              caption="Proves this decision has not been altered or quietly removed since it was made"
            />

            <div className="flex flex-wrap gap-3">
              <Button href={notice.appeal_url as never} icon="file">Contest this decision</Button>
            </div>

            <p className="max-w-measure text-caption text-muted">
              The decision above is signed and written into the same chain your prescriptions use. It
              cannot be reversed quietly or edited after the fact - any change is itself a new entry.
            </p>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
