import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Button, Icon, KitPage, SealMark, useTheme } from '@pramana/ui-components';
import type { Pharmacist } from '@pramana/types';
import { ROUTES } from '@/shared/constants/routes';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { getAccessToken, setAccessToken } from './api/client';
import { getMe } from './api/pharmacies.api';
import { VerifyPrescriptionPage } from './pages/VerifyPrescription/VerifyPrescriptionPage';
import { PharmacyOnboardingPage } from './pages/PharmacyOnboarding/PharmacyOnboardingPage';
import { PharmacistLoginPage } from './pages/Auth/PharmacistLoginPage';
import { TrustTierExplainerPage } from './pages/TrustTierExplainer/TrustTierExplainerPage';
import { PhotoVerificationPage } from './pages/PhotoVerification/PhotoVerificationPage';
import '@/styles/verification.css';

/**
 * Mounted by the root router at `verification/*`. This shell keeps its own
 * <Routes> (paths below are relative to /verification) because its pages take
 * the pharmacist session as props. It is not a second router: matching still
 * happens inside the one createBrowserRouter in src/router.tsx.
 *
 * Verification is the default route and is reachable without an account -
 * anything else would put a sign-in wall between a patient and the answer to
 * "is this prescription real?".
 */
export default function VerificationApp() {
  useDocumentTitle('Pramana - verify a prescription');
  const [pharmacist, setPharmacist] = useState<Pharmacist | null>(null);
  const [checked, setChecked] = useState(false);
  const { resolved, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!getAccessToken()) { setChecked(true); return; }
    getMe()
      .then(setPharmacist)
      .catch(() => setAccessToken(null))
      .finally(() => setChecked(true));
  }, []);

  function signOut() {
    setAccessToken(null);
    setPharmacist(null);
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line-2 bg-canvas/90 px-4 py-2 backdrop-blur-[10px]">
        <Link to={ROUTES.verification.verify} className="flex min-h-touch items-center gap-3 no-underline">
          <SealMark size={26} />
          <span className="font-document text-title-sm font-semibold">Pramāṇa</span>
          <span className="hidden border-l border-line pl-3 text-caption text-muted sm:inline">
            Verify a prescription
          </span>
        </Link>

        <div className="flex-1" />

        <Link to={ROUTES.verification.photoVerification} className="hidden min-h-touch items-center px-3 text-body-sm text-ink-3 no-underline hover:text-ink sm:inline-flex">
          Photo check
        </Link>

        <Link to={ROUTES.verification.trustTiers} className="hidden min-h-touch items-center px-3 text-body-sm text-ink-3 no-underline hover:text-ink sm:inline-flex">
          What the results mean
        </Link>

        <button
          type="button"
          onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
          aria-label={resolved === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
          className="inline-flex size-touch items-center justify-center rounded-control text-ink-3 hover:bg-canvas-2"
        >
          <Icon name={resolved === 'dark' ? 'sun' : 'moon'} />
        </button>

        {pharmacist ? (
          <>
            <span className="hidden text-caption text-muted lg:inline">
              {pharmacist.pharmacy_name ?? 'Pharmacy pending approval'}
            </span>
            <Button size="sm" variant="ghost" icon="logout" onClick={signOut}>
              <span className="max-sm:sr-only">Sign out</span>
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => navigate(ROUTES.verification.signIn)}>Sign in</Button>
        )}
      </header>

      <main key={location.pathname} className="route-enter px-4 py-6" tabIndex={-1}>
        {!checked ? (
          <div className="mx-auto flex max-w-content flex-col gap-4">
            <div className="skeleton h-9 w-56 rounded-control" />
            <div className="skeleton h-72 w-full rounded-card" />
          </div>
        ) : (
          <Routes>
            <Route index element={<Navigate to={ROUTES.verification.verify} replace />} />
            <Route path="verify" element={<VerifyPrescriptionPage pharmacist={pharmacist} />} />
            <Route path="photo-verification" element={<PhotoVerificationPage pharmacist={pharmacist} />} />
            <Route path="sign-in" element={<PharmacistLoginPage onSignedIn={(p) => { setPharmacist(p); navigate(ROUTES.verification.verify); }} />} />
            <Route path="register" element={<PharmacyOnboardingPage />} />
            <Route path="trust-tiers" element={<TrustTierExplainerPage />} />
            {/* SS5: the kit is a build target in every portal, not only the largest one. */}
            <Route path="kit" element={<KitPage />} />
            <Route path="*" element={<Navigate to={ROUTES.verification.verify} replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
