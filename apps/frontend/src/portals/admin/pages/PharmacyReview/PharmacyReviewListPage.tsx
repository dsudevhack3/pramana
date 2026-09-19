import { ROUTES } from '@/shared/constants/routes';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, InlineNotice } from '@pramana/ui-components';
import type { Pharmacy, PharmacyStatus } from '@pramana/types';
import { DataTable } from '../../components/common/DataTable';
import { listPharmacyReviews } from '../../api/admin.api';

const BADGE: Record<PharmacyStatus, { status: 'pending' | 'verified' | 'rejected' | 'suspended'; label: string }> = {
  PENDING: { status: 'pending', label: 'Awaiting approval' },
  APPROVED: { status: 'verified', label: 'Approved' },
  REJECTED: { status: 'rejected', label: 'Rejected' },
  SUSPENDED: { status: 'suspended', label: 'Suspended' },
};

/** Flow 0.5 review queue. Lightweight by design - licence number and address. */
export function PharmacyReviewListPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const status = params.get('status') ?? 'PENDING';

  useEffect(() => {
    setLoading(true);
    listPharmacyReviews({ status })
      .then((page) => setRows(page.items))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-title-lg">Pharmacies</h1>
        <p className="max-w-measure text-body-sm text-muted">
          New registrations and existing accounts. Approving one lets its pharmacists mark prescriptions
          as dispensed.
        </p>
      </header>

      {failed ? (
        <InlineNotice tone="amber" title="The list did not load" role="alert">Reload to try again.</InlineNotice>
      ) : null}

      {loading ? (
        <div className="skeleton h-[280px] rounded-card" />
      ) : (
        <DataTable
          caption="Pharmacy registrations"
          rows={rows}
          rowKey={(r) => r.id}
          severity={(r) => (r.status === 'SUSPENDED' ? 'high' : r.status === 'APPROVED' ? 'ok' : 'none')}
          onRowActivate={(r) => navigate(ROUTES.admin.pharmacyDetail(r.id))}
          filterText={(r) => `${r.name} ${r.license_number} ${r.address.line1}`}
          filterPlaceholder="Filter by name, licence or address"
          emptyState="No pharmacies are waiting for a decision."
          columns={[
            { key: 'name', header: 'Pharmacy', render: (r) => r.name, sortValue: (r) => r.name },
            {
              key: 'licence',
              header: 'Licence',
              render: (r) => <span className="font-mono text-mono">{r.license_number}</span>,
              sortValue: (r) => r.license_number,
            },
            { key: 'address', header: 'Address', render: (r) => r.address.line1, hideOnCards: true },
            {
              key: 'maps',
              header: 'Address found',
              render: (r) => <Badge status={r.maps_confirmed ? 'verified' : 'idle'} label={r.maps_confirmed ? 'Found' : 'Unconfirmed'} />,
            },
            { key: 'status', header: 'Status', render: (r) => <Badge {...BADGE[r.status]} />, sortValue: (r) => r.status },
            {
              key: 'open',
              header: 'Review',
              align: 'right',
              render: (r) => <Button size="sm" variant="ghost" onClick={() => navigate(ROUTES.admin.pharmacyDetail(r.id))}>Open</Button>,
            },
          ]}
        />
      )}
    </div>
  );
}
