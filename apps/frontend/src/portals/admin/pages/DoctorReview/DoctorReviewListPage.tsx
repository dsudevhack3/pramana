import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, InlineNotice } from '@pramana/ui-components';
import type { Doctor } from '@pramana/types';
import { DataTable } from '../../components/common/DataTable';
import { listDoctorReviews } from '../../api/admin.api';

/**
 * Flow 1 overflow: registrations that could not be approved automatically.
 *
 * Most rows here are a partial licence match - a married name, an initial, a
 * transposed date of birth. The queue is written to reflect that: these are
 * people waiting to work, not suspects.
 */
export function DoctorReviewListPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const status = params.get('status') ?? 'IN_REVIEW';

  useEffect(() => {
    setLoading(true);
    listDoctorReviews({ status })
      .then((page) => setRows(page.items))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Doctor registrations</h1>
        <p className="max-w-measure text-body-sm text-muted">
          Registrations the automatic licence check could not settle. Compare the name on the register
          against the name on the Aadhaar record and decide.
        </p>
      </header>

      {failed ? (
        <InlineNotice tone="amber" title="The queue did not load" role="alert">Reload to try again.</InlineNotice>
      ) : null}

      {loading ? (
        <div className="skeleton h-[280px] rounded-card" />
      ) : (
        <DataTable
          caption="Doctor registrations awaiting review"
          rows={rows}
          rowKey={(r) => r.id}
          severity={() => 'none'}
          onRowActivate={(r) => navigate(ROUTES.admin.doctorDetail(r.id))}
          filterText={(r) => `${r.name} ${r.email} ${r.license?.license_number ?? ''}`}
          filterPlaceholder="Filter by name, email or licence number"
          emptyState="No registrations are waiting."
          columns={[
            { key: 'name', header: 'Name', render: (r) => r.name, sortValue: (r) => r.name },
            {
              key: 'licence',
              header: 'Licence',
              render: (r) => <span className="font-mono text-mono">{r.license?.license_number ?? '—'}</span>,
              sortValue: (r) => r.license?.license_number ?? '',
            },
            {
              key: 'council',
              header: 'Council',
              render: (r) => r.license?.council_name ?? '—',
              hideOnCards: true,
            },
            {
              key: 'match',
              header: 'Match',
              render: (r) =>
                r.license?.match_result === 'partial' ? (
                  <Badge status="pending" label={`Partial · ${Math.round((r.license.match_confidence ?? 0) * 100)}%`} />
                ) : r.license?.match_result === 'exact' ? (
                  <Badge status="verified" label="Exact" />
                ) : (
                  <Badge status="rejected" label="No match" />
                ),
              sortValue: (r) => r.license?.match_confidence ?? 0,
            },
            {
              key: 'submitted',
              header: 'Submitted',
              render: (r) => new Date(r.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }),
              sortValue: (r) => r.created_at,
            },
            {
              key: 'open',
              header: 'Review',
              align: 'right',
              render: (r) => <Button size="sm" variant="ghost" onClick={() => navigate(ROUTES.admin.doctorDetail(r.id))}>Open</Button>,
            },
          ]}
        />
      )}
    </div>
  );
}
