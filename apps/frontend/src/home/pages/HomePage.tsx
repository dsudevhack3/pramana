import type { IconName } from '@pramana/ui-components';
import { ROUTES } from '@/shared/constants/routes';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { HomeHeader } from '../components/HomeHeader';
import { HomeFooter } from '../components/HomeFooter';
import { PortalCard } from '../components/PortalCard';

const PORTALS: Array<{ to: string; title: string; description: string; icon: IconName }> = [
  {
    to: ROUTES.doctor.root,
    title: 'Doctor Portal',
    description: 'Verify identity, onboard, and sign cryptographically secure prescriptions.',
    icon: 'pill',
  },
  {
    to: ROUTES.admin.root,
    title: 'Admin Portal',
    description: 'Review flagged behavior and manage platform enforcement actions.',
    icon: 'shieldCheck',
  },
  {
    to: ROUTES.verification.root,
    title: 'Verification Portal',
    description: 'Public scanner for pharmacists and patients to verify prescriptions.',
    icon: 'scan',
  },
  {
    to: ROUTES.organization.root,
    title: 'Organization Portal',
    description: 'For hospitals to manage their verified doctor roster and analytics.',
    icon: 'building',
  },
];

/** "/" is always this page. It never redirects into a portal: the visitor chooses. */
export function HomePage() {
  useDocumentTitle('Pramāṇa - Prescription Provenance Platform');

  return (
    <div className="flex min-h-dvh flex-col">
      <HomeHeader />

      <main className="route-enter flex-1 px-4 py-8" tabIndex={-1}>
        <div className="mx-auto flex max-w-content flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-title-lg">Prescription Provenance Platform</h1>
            <p className="max-w-measure text-body text-muted">
              Unified Frontend - Choose your portal to begin
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2" aria-label="Portals">
            {PORTALS.map((portal) => (
              <li key={portal.to} className="flex">
                <PortalCard {...portal} />
              </li>
            ))}
          </ul>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
