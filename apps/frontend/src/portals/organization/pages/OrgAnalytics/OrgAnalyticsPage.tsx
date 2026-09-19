import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, InlineNotice, StatusRow } from '@pramana/ui-components';
import type { OrgAnalytics } from '@pramana/types';
import { getAnalytics } from '../../api/organizations.api';

/**
 * Aggregate figures only. There is deliberately no per-doctor drill-down into
 * individual prescriptions here: an organisation needs to see its own volume
 * and licence-expiry exposure, not to read what its doctors prescribed to named
 * patients. Clinical detail is not the org admin's to see.
 *
 * SS7.5: the chart draws once, on first view, and never re-animates on a filter
 * change. SS3: no shadows - the chart sits in a bordered card like everything else.
 */
function Sparkline({ points }: { points: Array<{ date: string; count: number }> }) {
  if (points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.count), 1);
  const width = 640;
  const height = 160;
  const step = width / (points.length - 1);

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${(height - (p.count / max) * (height - 12)).toFixed(1)}`)
    .join(' ');

  return (
    <div className="scroll-thin overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[160px] w-full min-w-[420px]"
        role="img"
        aria-label={`Prescriptions per day. Highest day: ${max}.`}
      >
        <path d={path} fill="none" stroke="var(--tourmaline)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="var(--line)" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function OrgAnalyticsPage() {
  const [data, setData] = useState<OrgAnalytics | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getAnalytics({ days: 30 }).then(setData).catch(() => setFailed(true));
  }, []);

  if (failed) {
    return <InlineNotice tone="amber" title="The figures did not load" role="alert">Reload to try again.</InlineNotice>;
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-9 w-56 rounded-control" />
        <div className="skeleton h-64 w-full rounded-card" />
      </div>
    );
  }

  const change = data.prescriptions_prev_30d
    ? Math.round(((data.prescriptions_30d - data.prescriptions_prev_30d) / data.prescriptions_prev_30d) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Activity</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Volume and licence exposure across your roster. Aggregate only — clinical detail stays between
          the doctor, the patient and the pharmacist.
        </p>
      </header>

      <Card>
        <CardHeader title="Prescriptions per day" description="The last 30 days." />
        <CardBody className="flex flex-col gap-4">
          <Sparkline points={data.by_day} />
          <div>
            <StatusRow
              label="Last 30 days"
              value={`${data.prescriptions_30d.toLocaleString('en-IN')} prescriptions`}
            />
            <StatusRow
              label="Compared with the 30 days before"
              value={change === 0 ? 'About the same' : `${change > 0 ? 'Up' : 'Down'} ${Math.abs(change)}%`}
            />
            <StatusRow label="Doctors who signed anything" value={data.active_prescribers.toLocaleString('en-IN')} />
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="What happened to them" description="Sealed means signed. Dispensed means a pharmacist consumed the token." />
          <CardBody>
            <StatusRow label="Sealed, not yet dispensed" value={`${Math.round(data.sealed_share * 100)}%`} />
            <StatusRow label="Dispensed" value={`${Math.round(data.consumed_share * 100)}%`} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Licences expiring soon" description="Within the next 60 days." />
          <CardBody className="flex flex-col gap-4">
            <StatusRow
              label="Doctors affected"
              value={data.licenses_expiring_soon.toLocaleString('en-IN')}
            />
            {data.licenses_expiring_soon > 0 ? (
              <InlineNotice tone="amber" title="Worth a word in advance">
                When a licence lapses, that doctor stops being able to sign. Prescriptions they signed
                before the lapse stay valid and dispensable — but nothing new can be written.
              </InlineNotice>
            ) : (
              <InlineNotice tone="tourmaline" title="Nothing expiring">
                No licence on your roster lapses in the next 60 days.
              </InlineNotice>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
