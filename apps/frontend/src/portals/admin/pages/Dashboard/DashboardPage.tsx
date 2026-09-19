import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, CardBody, CardHeader, Icon, InlineNotice, StatusRow } from '@pramana/ui-components';
import { getDashboard, type DashboardSummary } from '../../api/admin.api';
import { checkChainIntegrity } from '../../api/enforcement.api';
import type { ChainIntegrityReport } from '@pramana/types';

/**
 * The first screen of a shift: what is waiting, and is the chain still intact.
 *
 * SS11: no dashboard-widget grid of identical shadowed cards. The queue counts
 * are the content, so they are links you act on, and the integrity state gets a
 * full-width row because a broken chain outranks every queue on this page.
 */
function QueueTile({ to, label, count, hint, tone }: {
  to: string; label: string; count: number; hint: string;
  tone: 'scarlet' | 'amber' | 'neutral';
}) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-2 rounded-card border border-line bg-surface p-5 no-underline transition-colors duration-instant ease-out hover:bg-canvas-2"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-body-sm font-semibold text-ink">{label}</span>
        <Icon name="chevronRight" size={17} className="text-muted" />
      </span>
      <span
        className={
          tone === 'scarlet' ? 'font-document text-title-lg text-scarlet'
          : tone === 'amber' ? 'font-document text-title-lg text-amber'
          : 'font-document text-title-lg text-ink'
        }
      >
        {count.toLocaleString('en-IN')}
      </span>
      <span className="max-w-measure text-caption text-muted">{hint}</span>
    </Link>
  );
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [integrity, setIntegrity] = useState<ChainIntegrityReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getDashboard().then(setSummary).catch(() => setFailed(true));
  }, []);

  async function recheck() {
    setChecking(true);
    try {
      setIntegrity(await checkChainIntegrity());
    } finally {
      setChecking(false);
    }
  }

  const intact = integrity?.intact ?? summary?.integrity_intact ?? true;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Overview</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Everything on this page is waiting for a person. Nothing here acts on its own.
        </p>
      </header>

      {failed ? (
        <InlineNotice tone="amber" title="The summary did not load" role="alert">
          Reload the page. The queues below are still reachable from the navigation.
        </InlineNotice>
      ) : null}

      {!intact ? (
        <InlineNotice tone="scarlet" title="The record chain does not verify" role="alert">
          A link failed to recompute{integrity?.first_broken_sequence ? ` at sequence ${integrity.first_broken_sequence}` : ''}.
          Stop making decisions and escalate this before anything else.
        </InlineNotice>
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QueueTile
              to={`${ROUTES.admin.flagged}?severity=high`}
              label="High-severity flags"
              count={summary.candidates_by_severity.high}
              hint="Rules that fired well past their threshold. Read the evidence before acting."
              tone="scarlet"
            />
            <QueueTile
              to={ROUTES.admin.flagged}
              label="Open candidates"
              count={summary.open_candidates}
              hint="Everything the flagging engine has raised and nobody has resolved."
              tone="amber"
            />
            <QueueTile
              to={`${ROUTES.admin.doctors}?status=IN_REVIEW`}
              label="Doctors awaiting review"
              count={summary.doctors_awaiting_review}
              hint="Mostly partial licence matches: a name change or an initial."
              tone="neutral"
            />
            <QueueTile
              to={`${ROUTES.admin.pharmacies}?status=PENDING`}
              label="Pharmacies awaiting approval"
              count={summary.pharmacies_awaiting_review}
              hint="New registrations. Check the licence number against the state register."
              tone="neutral"
            />
            <QueueTile
              to={ROUTES.admin.ledger}
              label="Decisions in the last 7 days"
              count={summary.actions_last_7d}
              hint="Every one signed, and readable by the person it affected."
              tone="neutral"
            />
            <QueueTile
              to={ROUTES.admin.audit}
              label="Records in the chain"
              count={summary.chain_height}
              hint="Prescriptions and admin decisions share one chain."
              tone="neutral"
            />
          </div>

          <Card>
            <CardHeader
              title="Chain integrity"
              description="Recomputes every link and compares it against what is stored."
              actions={
                <Button variant="ghost" icon="refresh" loading={checking} loadingLabel="Recomputing" onClick={recheck}>
                  Check now
                </Button>
              }
            />
            <CardBody>
              <StatusRow
                label="Last automatic check"
                value={
                  summary.last_integrity_check
                    ? new Date(summary.last_integrity_check).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })
                    : 'Not run yet'
                }
                status={<Badge status={intact ? 'verified' : 'rejected'} label={intact ? 'Intact' : 'Broken'} />}
              />
              {integrity ? (
                <>
                  <StatusRow label="Links checked just now" value={integrity.checked_links.toLocaleString('en-IN')} />
                  <StatusRow
                    label="Result"
                    value={integrity.intact ? 'Every link recomputed correctly' : `First break at sequence ${integrity.first_broken_sequence}`}
                    status={<Badge status={integrity.intact ? 'verified' : 'rejected'} />}
                  />
                </>
              ) : null}
            </CardBody>
          </Card>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-[132px] rounded-card" />)}
        </div>
      )}
    </div>
  );
}
