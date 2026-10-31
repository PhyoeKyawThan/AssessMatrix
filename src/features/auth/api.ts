import { apiRequest } from '@/shared/api/client';
import type { TokenPair } from '@/shared/api/types';

import type { SessionUser } from '@/features/auth/types';

/** POST /api/token/ — login uses email and returns the JSON pair on the mobile path. */
export function signInRequest(email: string, password: string): Promise<TokenPair> {
  return apiRequest<TokenPair>('/api/token/', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function fetchCurrentUser(): Promise<SessionUser> {
  return apiRequest<SessionUser>('/api/me/');
}

export function updateCurrentUser(body: { full_name?: string; current_password?: string; new_password?: string }): Promise<SessionUser> {
  return apiRequest<SessionUser>('/api/me/', { method: 'PATCH', body });
}

export function deleteCurrentUser(): Promise<void> {
  return apiRequest<void>('/api/me/', { method: 'DELETE' });
}

/** POST /api/token/logout/ — 204, and the refresh token lands on the blacklist. */
export function logoutRequest(refresh: string): Promise<void> {
  return apiRequest<void>('/api/token/logout/', { method: 'POST', body: { refresh } });
}
