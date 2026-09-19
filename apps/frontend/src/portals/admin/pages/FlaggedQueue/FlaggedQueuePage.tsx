import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, InlineNotice, cn } from '@pramana/ui-components';
import type { FlaggedCandidate, FlagSeverity } from '@pramana/types';
import { DataTable } from '../../components/common/DataTable';
import { listCandidates } from '../../api/flagging.api';

/**
 * Flow 5, the queue.
 *
 * SS1: severity is carried by the row rule, the badge colour, the badge icon
 * AND the badge word. A reviewer skimming this in greyscale still sorts the
 * page correctly.
 */
const RULE_LABEL: Record<string, string> = {
  doctor_shopping: 'Doctor shopping',
  pharmacy_concentration: 'Pharmacy concentration',
  signing_pace: 'Signing pace',
  geo_mismatch: 'Geo mismatch',
};

const SEVERITY_BADGE: Record<FlagSeverity, { status: 'rejected' | 'pending' | 'idle'; label: string }> = {
  high: { status: 'rejected', label: 'High' },
  medium: { status: 'pending', label: 'Medium' },
  low: { status: 'idle', label: 'Low' },
};

export function FlaggedQueuePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState<FlaggedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const severity = params.get('severity') ?? '';
  const state = params.get('state') ?? 'OPEN';

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    listCandidates({ severity: severity || undefined, state })
      .then((page) => setRows(page.items))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [severity, state]);

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Flagged candidates</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Patterns a deterministic rule matched. Nothing has been done to any of these accounts - that
          is your decision, and it will carry your signature.
        </p>
      </header>

      {/* SS10: filters are in the URL, so a queue view is shareable and deep-linkable. */}
      <div className="flex flex-wrap gap-2">
        {([['', 'All severities'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] as const).map(
          ([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter('severity', value)}
              className={cn(
                'min-h-touch rounded-full border px-4 text-body-sm font-medium',
                severity === value ? 'border-seal bg-seal-wash text-seal' : 'border-line text-ink-3 hover:bg-canvas-2',
              )}
            >
              {label}
            </button>
          ),
        )}
        <span className="w-px" />
        {([['OPEN', 'Open'], ['ACTIONED', 'Actioned'], ['DISMISSED', 'Dismissed']] as const).map(
          ([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter('state', value)}
              className={cn(
                'min-h-touch rounded-full border px-4 text-body-sm font-medium',
                state === value ? 'border-ink bg-ink text-canvas' : 'border-line text-ink-3 hover:bg-canvas-2',
              )}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {failed ? (
        <InlineNotice tone="amber" title="The queue did not load" role="alert">
          Reload the page to try again.
        </InlineNotice>
      ) : null}

      {loading ? (
        <div className="skeleton h-[320px] rounded-card" />
      ) : (
        <DataTable
          caption="Flagged candidates awaiting review"
          rows={rows}
          rowKey={(r) => r.id}
          severity={(r) => r.severity}
          onRowActivate={(r) => navigate(ROUTES.admin.flaggedDetail(r.id))}
          filterText={(r) => `${r.reference} ${r.actor_name} ${RULE_LABEL[r.rule] ?? r.rule} ${r.headline}`}
          filterPlaceholder="Filter by name, rule or reference"
          emptyState="Nothing is waiting. That is the intended steady state, not an error."
          columns={[
            {
              key: 'reference',
              header: 'Reference',
              render: (r) => <span className="font-mono text-mono">{r.reference}</span>,
              sortValue: (r) => r.reference,
            },
            {
              key: 'actor',
              header: 'Subject',
              render: (r) => (
                <span className="flex flex-col">
                  <span className="font-medium">{r.actor_name}</span>
                  <span className="text-caption text-muted">{r.actor_type}</span>
                </span>
              ),
              sortValue: (r) => r.actor_name,
            },
            {
              key: 'rule',
              header: 'Rule',
              render: (r) => RULE_LABEL[r.rule] ?? r.rule,
              sortValue: (r) => r.rule,
            },
            {
              key: 'headline',
              header: 'What fired',
              render: (r) => <span className="max-w-measure">{r.headline}</span>,
              hideOnCards: true,
            },
            {
              key: 'severity',
              header: 'Severity',
              render: (r) => <Badge {...SEVERITY_BADGE[r.severity]} />,
              sortValue: (r) => ({ high: 0, medium: 1, low: 2 })[r.severity],
            },
            {
              key: 'raised',
              header: 'Raised',
              render: (r) => new Date(r.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }),
              sortValue: (r) => r.created_at,
            },
            {
              key: 'open',
              header: 'Review',
              align: 'right',
              render: (r) => (
                <Button size="sm" variant="ghost" onClick={() => navigate(ROUTES.admin.flaggedDetail(r.id))}>Open</Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
