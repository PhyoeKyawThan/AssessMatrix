import { apiRequest } from '@/shared/api/client';
import { qs } from '@/shared/api/query';
import type { Page } from '@/shared/api/use-resource';
import type { Role } from '@/features/auth/types';

export interface InboxNotification {
  id: string;
  sender: { id: string; full_name: string; role: Role };
  title: string;
  body: string;
  requires_acknowledgement: boolean;
  created_at: string;
  read_at: string | null;
  acknowledged_at: string | null;
}

export interface SentNotification {
  id: string;
  title: string;
  body: string;
  requires_acknowledgement: boolean;
  delivery_count: number;
  recipient_count: number;
  read_count: number;
  acknowledged_count: number;
  created_at: string;
}

export interface EligibleRecipient {
  id: string;
  full_name: string;
  email: string;
  role: Role;
}

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
  inbox: (page = 1, unread = false) => apiRequest<Page<InboxNotification>>(`/api/notifications/${qs({ page, unread: unread ? 'true' : undefined })}`),
  sent: (page = 1) => apiRequest<Page<SentNotification>>(`/api/notifications/sent/${qs({ page })}`),
  eligible: (search?: string) => apiRequest<EligibleRecipient[]>(`/api/notifications/eligible-recipients/${qs({ search })}`),
  create: (body: {
    title: string;
    body: string;
    requires_acknowledgement: boolean;
    recipient_ids?: string[];
    target_role?: 'ALL' | 'STUDENT_AFFAIRS' | 'TEACHER' | 'STUDENT';
    module_id?: string;
  }) => apiRequest<SentNotification>('/api/notifications/', { method: 'POST', body }),
  markRead: (id: string) => apiRequest<InboxNotification>(`/api/notifications/${id}/mark-read/`, { method: 'POST', body: {} }),
  acknowledge: (id: string) => apiRequest<InboxNotification>(`/api/notifications/${id}/acknowledge/`, { method: 'POST', body: {} }),
};
