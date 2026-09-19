import { ROUTES } from '@/shared/constants/routes';
import { createHttpClient } from '@pramana/api-client';

/**
 * SS10: the single network surface for this app.
 *
 * A pharmacist's session persists in sessionStorage rather than memory, because
 * a counter terminal gets reloaded constantly and re-authenticating on every
 * refresh would push staff toward leaving it permanently signed in on a shared
 * machine - which is worse. It clears when the tab closes.
 */
const KEY = 'pramana.pharmacist.token';

export function setAccessToken(token: string | null) {
  if (token) sessionStorage.setItem(KEY, token);
  else sessionStorage.removeItem(KEY);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(KEY);
}

export const api = createHttpClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  getToken: getAccessToken,
  onUnauthorized: () => {
    setAccessToken(null);
    window.location.assign(ROUTES.verification.signIn);
  },
});
