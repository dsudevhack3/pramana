import { ROUTES } from '@/shared/constants/routes';
import { createHttpClient } from '@pramana/api-client';

/** SS10: the single network surface for this app. */
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export const api = createHttpClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  getToken: () => accessToken,
  onUnauthorized: () => {
    accessToken = null;
    // The organisation portal has no sign-in screen, so a 401 sends the browser Home.
    // Pointing at this portal's own root would loop: its first request would 401 again.
    console.warn('401: redirect disabled');
  },
});
