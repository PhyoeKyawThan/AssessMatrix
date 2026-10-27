import { apiRequest } from '@/shared/api/client';
import type { Dashboard } from '@/features/dashboard/types';

export const dashboardApi = {
  get: () => apiRequest<Dashboard>('/api/dashboard/'),
};
