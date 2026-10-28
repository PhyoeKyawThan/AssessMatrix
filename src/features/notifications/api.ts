import { apiRequest } from '@/shared/api/client';

/**
 * The device credential lives on the account, one token per user. Registering a second device
 * replaces the first, which is what a reinstall or a new phone needs.
 */
export const notificationsApi = {
  register: (pushToken: string) =>
    apiRequest<{ has_push_token: boolean }>('/api/me/push-token/', {
      method: 'POST',
      body: { push_token: pushToken },
    }),
  /** Sign-out forgets this device so the backend stops pushing to a session nobody owns. */
  clear: () => apiRequest<undefined>('/api/me/push-token/', { method: 'DELETE' }),
};
