import { Provider } from 'react-redux';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { InlineNotice } from '@pramana/ui-components';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { useAuth } from './features/auth/useAuth';
import { store } from './store';
import '@/styles/doctor.css';

/**
 * SS7.1: the incoming screen arrives as one object. The route key on <main>
 * replays the entrance animation on navigation; children never stagger in.
 */
function DoctorLayout() {
  const location = useLocation();
  const { doctor, status } = useAuth();
  useDocumentTitle('Pramana - doctor portal');

  return (
    <div className="mx-auto grid max-w-[1476px] grid-cols-1 lg:grid-cols-[var(--rail-width)_minmax(0,1fr)]">
      <div className="lg:col-span-full">
        <Header />
      </div>

      <Sidebar />

      <main key={location.pathname} className="route-enter min-w-0" tabIndex={-1}>
        <div className="mx-auto max-w-content px-4 pb-10 pt-5 max-sm:pb-[calc(96px+env(safe-area-inset-bottom))]">
          {doctor?.is_suspended ? (
            <InlineNotice tone="scarlet" title="Your account is suspended" className="mb-5" role="alert">
              You cannot sign new prescriptions. Everything you signed before the suspension stays valid.
              Open Verification to read the exact reason and the evidence it cites.
            </InlineNotice>
          ) : null}

          {status === 'error' ? (
            <InlineNotice tone="amber" title="Your profile did not load" className="mb-5" role="alert">
              Reload the page. If it keeps failing, the API is unreachable from this browser.
            </InlineNotice>
          ) : null}

          <Outlet />
        </div>
      </main>

      <ScrollRestoration />
    </div>
  );
}

/**
 * The doctor Redux store is provided here, not at the app root: the session,
 * profile and signing-key state exist only inside /doctor and cannot be read
 * by the admin, verification or organisation portals.
 */
export default function DoctorApp() {
  return (
    <Provider store={store}>
      <DoctorLayout />
    </Provider>
  );
}
