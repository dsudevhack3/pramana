import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { Icon, InlineNotice, SealMark, cn, useTheme } from '@pramana/ui-components';
import { ROUTES } from '@/shared/constants/routes';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import type { Organization } from '@pramana/types';
import { getMyOrganization } from './api/organizations.api';
import { OrgStatusBadge } from './components/common/OrgStatusBadge';
import '@/styles/organization.css';

const NAV = [
  { to: ROUTES.organization.doctors, label: 'Doctors' },
  { to: ROUTES.organization.activity, label: 'Activity' },
  { to: ROUTES.organization.register, label: 'Registration' },
];

export default function OrganizationApp() {
  useDocumentTitle('Pramana - organisation portal');
  const location = useLocation();
  const { resolved, setTheme } = useTheme();
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    getMyOrganization().then(setOrg).catch(() => setOrg(null));
  }, []);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 flex flex-col border-b border-line-2 bg-canvas/90 backdrop-blur-[10px]">
        <div className="flex items-center gap-3 px-4 py-2">
          <Link to={ROUTES.organization.doctors} className="flex min-h-touch items-center gap-3 no-underline">
            <SealMark size={26} />
            <span className="font-document text-title-sm font-semibold">Pramāṇa</span>
            <span className="hidden border-l border-line pl-3 text-caption text-muted sm:inline">
              {org?.name ?? 'Organisation portal'}
            </span>
          </Link>

          <div className="flex-1" />

          {org ? <OrgStatusBadge status={org.status} /> : null}

          <button
            type="button"
            onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
            aria-label={resolved === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
            className="inline-flex size-touch items-center justify-center rounded-control text-ink-3 hover:bg-canvas-2"
          >
            <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>

        <nav aria-label="Organisation sections" className="scroll-none flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[38px] shrink-0 items-center rounded-control px-3 text-body-sm font-medium no-underline',
                  'transition-colors duration-instant ease-out',
                  isActive ? 'bg-seal-wash text-seal' : 'text-ink-3 hover:bg-canvas-2 hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main key={location.pathname} className="route-enter" tabIndex={-1}>
        <div className="mx-auto max-w-content px-4 py-6">
          {org && org.status !== 'VERIFIED' ? (
            <InlineNotice tone="amber" title="Your organisation is not verified yet" className="mb-5">
              You can prepare your roster, but invites are only sent once a reviewer clears the
              registration.
            </InlineNotice>
          ) : null}
          <Outlet />
        </div>
      </main>

      <ScrollRestoration />
    </div>
  );
}
