import { useEffect, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';
import { InlineNotice } from '@pramana/ui-components';
import { ROUTES } from '@/shared/constants/routes';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { AdminHeader } from './components/Layout/AdminHeader';
import { getMe, type AdminProfile } from './api/admin.api';
import { isAdminKeyUnlocked, lockAdminKey } from './api/enforcement.api';
import '@/styles/admin.css';

export default function AdminApp() {
  useDocumentTitle('Pramana - platform admin');
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [keyUnlocked, setKeyUnlocked] = useState(isAdminKeyUnlocked());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getMe().then(setProfile).catch(() => setFailed(true));
  }, []);

  // The header's lock indicator has to track a module-level flag rather than
  // React state, so it is re-read on every navigation.
  useEffect(() => { setKeyUnlocked(isAdminKeyUnlocked()); }, [location.pathname]);

  return (
    <div className="min-h-dvh">
      <AdminHeader
        adminName={profile?.name ?? null}
        keyUnlocked={keyUnlocked}
        onLockKey={() => { lockAdminKey(); setKeyUnlocked(false); }}
      />

      <main key={location.pathname} className="route-enter" tabIndex={-1}>
        <div className="mx-auto max-w-content px-4 py-6">
          {failed ? (
            <InlineNotice tone="amber" title="Your profile did not load" className="mb-5" role="alert">
              Reload the page. If it keeps failing, the API is unreachable from this browser.
            </InlineNotice>
          ) : null}

          {profile && !profile.signing_key ? (
            <InlineNotice tone="seal" title="You have no signing key yet" className="mb-5">
              You can read every queue, but recording a decision needs a key.{' '}
              <button type="button" className="underline" onClick={() => navigate(ROUTES.admin.settingsKey)}>
                Set one up
              </button>{' '}
              — it takes about a minute.
            </InlineNotice>
          ) : null}

          <Outlet />
        </div>
      </main>

      <ScrollRestoration />
    </div>
  );
}
