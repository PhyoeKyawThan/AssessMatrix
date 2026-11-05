import { API_URL } from '@/shared/config/env';
import { ApiError, type ApiErrorBody, type TokenPair } from '@/shared/api/types';
import { clearTokens, loadTokens, saveTokens } from '@/shared/storage/token-storage';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Attach the stored access token. Requests for a token themselves pass false. */
  auth?: boolean;
}

const BASE_HEADERS: Record<string, string> = {
  // The contract's mobile path: JSON tokens plus an Authorization header, no cookies.
  'Client-Type': 'mobile',
  Accept: 'application/json',
};

let pendingRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (tokens === null) return null;

  const response = await fetch(`${API_URL}/api/token/refresh/`, {
    method: 'POST',
    headers: { ...BASE_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: tokens.refresh }),
  });

  if (!response.ok) {
    await clearTokens();
    return null;
  }

  const rotated = (await response.json()) as TokenPair;
  await saveTokens(rotated);
  return rotated.access;
}

/** Concurrent 401s share one refresh so the rotating refresh token is not replayed. */
function refreshOnce(): Promise<string | null> {
  pendingRefresh ??= refreshAccessToken().finally(() => {
    pendingRefresh = null;
  });
  return pendingRefresh;
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody = {};
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = { detail: response.statusText || 'Request failed.' };
  }
  return new ApiError(response.status, body);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const send = async (access: string | null): Promise<Response> => {
    const headers: Record<string, string> = { ...BASE_HEADERS };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (access !== null) headers.Authorization = `Bearer ${access}`;

    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  const stored = auth ? (await loadTokens())?.access ?? null : null;
  let response = await send(stored);

  if (response.status === 401 && stored !== null) {
    const refreshed = await refreshOnce();
    if (refreshed !== null) response = await send(refreshed);
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Multipart request used for native/web file uploads; fetch supplies the boundary header. */
export async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const send = async (access: string | null): Promise<Response> => {
    const headers: Record<string, string> = { ...BASE_HEADERS };
    if (access !== null) headers.Authorization = `Bearer ${access}`;
    return fetch(`${API_URL}${path}`, { method: 'POST', headers, body });
  };

  const stored = (await loadTokens())?.access ?? null;
  let response = await send(stored);
  if (response.status === 401 && stored !== null) {
    const refreshed = await refreshOnce();
    if (refreshed !== null) response = await send(refreshed);
  }
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}
