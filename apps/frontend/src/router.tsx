import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { KitPage } from '@pramana/ui-components';
import App from './App';
import { HomePage } from './home/pages/HomePage';
import { NotFoundPage, RouteError } from './shared/components/RouteError';
import { PageSkeleton } from './shared/components/PageSkeleton';
import { ROUTES } from './shared/constants/routes';

/**
 * ONE router for the whole product. Each portal is a layout route under its
 * own prefix; its pages are children. Portal layouts and pages are loaded on
 * demand, so opening /verification does not download the admin portal.
 */

// react-router `lazy` helpers: one for a default export (a portal layout),
// one for a named export (a page).
const layout = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});
const page = <M extends Record<string, unknown>, K extends keyof M>(load: () => Promise<M>, name: K) =>
  async () => ({ Component: (await load())[name] as ComponentType });

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouteError />,
    HydrateFallback: PageSkeleton,
    children: [
      // "/" is Home and only Home. It never redirects into a portal.
      { index: true, element: <HomePage /> },

      // ------------------------------------------------------------ doctor
      {
        path: 'doctor',
        lazy: layout(() => import('./portals/doctor/App')),
        children: [
          { index: true, element: <Navigate to={ROUTES.doctor.prescribe} replace /> },
          { path: 'onboarding', lazy: page(() => import('./portals/doctor/pages/Onboarding/OnboardingPage'), 'OnboardingPage') },
          { path: 'prescribe', lazy: page(() => import('./portals/doctor/pages/PrescriptionCreate/PrescriptionCreatePage'), 'PrescriptionCreatePage') },
          { path: 'prescriptions', lazy: page(() => import('./portals/doctor/pages/PrescriptionHistory/PrescriptionHistoryPage'), 'PrescriptionHistoryPage') },
          { path: 'status', lazy: page(() => import('./portals/doctor/pages/ProfileVerificationStatus/VerificationStatusPage'), 'VerificationStatusPage') },
          { path: 'kit', element: <KitPage /> },
        ],
      },

      // ------------------------------------------------------------- admin
      {
        path: 'admin',
        lazy: layout(() => import('./portals/admin/App')),
        children: [
          { index: true, element: <Navigate to={ROUTES.admin.dashboard} replace /> },
          { path: 'dashboard', lazy: page(() => import('./portals/admin/pages/Dashboard/DashboardPage'), 'DashboardPage') },
          { path: 'flagged', lazy: page(() => import('./portals/admin/pages/FlaggedQueue/FlaggedQueuePage'), 'FlaggedQueuePage') },
          { path: 'flagged/:candidateId', lazy: page(() => import('./portals/admin/pages/FlaggedQueue/FlaggedQueueDetailPage'), 'FlaggedQueueDetailPage') },
          { path: 'doctors', lazy: page(() => import('./portals/admin/pages/DoctorReview/DoctorReviewListPage'), 'DoctorReviewListPage') },
          { path: 'doctors/:doctorId', lazy: page(() => import('./portals/admin/pages/DoctorReview/DoctorReviewDetailPage'), 'DoctorReviewDetailPage') },
          { path: 'pharmacies', lazy: page(() => import('./portals/admin/pages/PharmacyReview/PharmacyReviewListPage'), 'PharmacyReviewListPage') },
          { path: 'pharmacies/:pharmacyId', lazy: page(() => import('./portals/admin/pages/PharmacyReview/PharmacyReviewDetailPage'), 'PharmacyReviewDetailPage') },
          { path: 'patient-flags', lazy: page(() => import('./portals/admin/pages/PatientFlags/PatientFlagsPage'), 'PatientFlagsPage') },
          { path: 'ledger', lazy: page(() => import('./portals/admin/pages/AdminActionLedger/AdminActionLedgerPage'), 'AdminActionLedgerPage') },
          { path: 'audit', lazy: page(() => import('./portals/admin/pages/AuditLogViewer/AuditLogViewerPage'), 'AuditLogViewerPage') },
          { path: 'settings/key', lazy: page(() => import('./portals/admin/pages/Settings/AdminKeySetupPage'), 'AdminKeySetupPage') },
          { path: 'kit', element: <KitPage /> },
        ],
      },

      // ------------------------------------------------------ verification
      // A splat route: this portal's pages take the pharmacist session from
      // its shell as props, so the shell keeps its own <Routes> (see
      // portals/verification/App.tsx). Every path under /verification/* is
      // still resolved by this one router.
      {
        path: 'verification/*',
        lazy: layout(() => import('./portals/verification/App')),
      },

      // ------------------------------------------------------ organization
      {
        path: 'organization',
        lazy: layout(() => import('./portals/organization/App')),
        children: [
          { index: true, element: <Navigate to={ROUTES.organization.doctors} replace /> },
          { path: 'register', lazy: page(() => import('./portals/organization/pages/OrgOnboarding/OrgOnboardingPage'), 'OrgOnboardingPage') },
          { path: 'doctors', lazy: page(() => import('./portals/organization/pages/DoctorRoster/DoctorRosterPage'), 'DoctorRosterPage') },
          { path: 'activity', lazy: page(() => import('./portals/organization/pages/OrgAnalytics/OrgAnalyticsPage'), 'OrgAnalyticsPage') },
          { path: 'kit', element: <KitPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
