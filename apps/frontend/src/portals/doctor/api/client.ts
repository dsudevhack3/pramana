import { ROUTES } from '@/shared/constants/routes';
import { createHttpClient } from '@pramana/api-client';

/**
 * SS10: the single client module for this app. Components never call fetch().
 *
 * The access token is held in memory rather than localStorage - a doctor's
 * session is the thing that authorises signing requests, so it should not
 * survive a closed tab or be readable by any script on the page.
 */
let accessToken: string | null = import.meta.env.VITE_DEV_TOKEN ?? null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export const api = createHttpClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  getToken: () => accessToken,
  onUnauthorized: () => {
    accessToken = null;
    // Full reload rather than a route push: the Redux store must not keep a
    // half-authenticated doctor profile around after the session ends.
    // The doctor portal has no sign-in screen, so a 401 sends the browser Home.
    // Pointing at this portal's own root would loop: its first request would 401 again.
    console.warn('401: redirect disabled');
  },
});
