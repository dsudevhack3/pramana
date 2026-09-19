import type { ApiErrorBody } from '@pramana/types';

/**
 * The one place a network call is made. SS10: never a scattered fetch() inside
 * a component - every app builds exactly one client from this factory and
 * exposes typed functions from its api/*.api.ts modules.
 *
 * Responsibilities kept here so no app repeats them:
 *  - base URL and credentials
 *  - bearer token attachment and 401 handling
 *  - idempotency key pass-through for POSTs that create records
 *  - turning the backend's error envelope into a typed ApiError
 *  - request-id capture for support and the audit trail
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string[]>;
  readonly requestId?: string;

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.message ?? 'The request did not complete.');
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code ?? 'unknown_error';
    this.details = body.details;
    this.requestId = body.request_id;
  }

  /** Field-level message for a form, if the backend supplied one. */
  fieldError(field: string): string | undefined {
    return this.details?.[field]?.[0];
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Replayed unchanged on retry so a double-submit cannot create two records. */
  idempotencyKey?: string;
  signal?: AbortSignal;
  /** Skips the Authorization header, for login and public verification routes. */
  anonymous?: boolean;
}

export interface HttpClientOptions {
  baseUrl: string;
  /** Called before each request. Return null to send the request anonymously. */
  getToken: () => string | null;
  /** Called on any 401 so the app can clear its session and route to login. */
  onUnauthorized?: () => void;
}

export interface HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  del<T>(path: string, options?: RequestOptions): Promise<T>;
}

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function createHttpClient({ baseUrl, getToken, onUnauthorized }: HttpClientOptions): HttpClient {
  async function request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const isFormDataBody = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !isFormDataBody) headers['Content-Type'] = 'application/json';

    if (!options.anonymous) {
      const token = getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

    const response = await fetch(buildUrl(baseUrl, path, options.query), {
      method,
      headers,
      credentials: 'include',
      body: body === undefined
        ? undefined
        : isFormDataBody
          ? body as FormData
          : JSON.stringify(body),
      signal: options.signal,
    });

    if (response.status === 401) {
      onUnauthorized?.();
      throw new ApiError(401, { code: 'unauthenticated', message: 'Your session has ended. Sign in again to continue.' });
    }

    if (response.status === 204) return undefined as T;

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        if (response.ok) {
          throw new ApiError(response.status, { code: 'bad_response', message: 'The server sent an unreadable response.' });
        }
        // Non-JSON error body (plain text, HTML, a proxy error page): show its start instead of a parse error.
        payload = { code: 'server_error', message: `Server error ${response.status}: ${text.slice(0, 300)}` };
      }
    }

    if (!response.ok) {
      throw new ApiError(response.status, (payload ?? {}) as Partial<ApiErrorBody>);
    }
    return payload as T;
  }

  return {
    get: (path, options) => request('GET', path, undefined, options),
    post: (path, body, options) => request('POST', path, body, options),
    patch: (path, body, options) => request('PATCH', path, body, options),
    del: (path, options) => request('DELETE', path, undefined, options),
  };
}
