import { apiRequest } from '@/shared/api/client';
import { qs } from '@/shared/api/query';
import type { Role, SessionUser } from '@/features/auth/types';
import type { Page } from '@/shared/api/use-resource';

export type User = SessionUser;

export interface UserCreateBody {
  username: string;
  email: string;
  full_name: string;
  role: Role;
  password: string;
}

/** Fields the admin update serializer accepts. */
export type UserPatchBody = Partial<Pick<User, 'full_name' | 'role' | 'is_active' | 'email' | 'username'>>;

export const usersApi = {
  list: (params: { role?: string; is_active?: string; search?: string; page?: number; page_size?: number } = {}) =>
    apiRequest<Page<User>>(`/api/users/${qs(params)}`),
  create: (body: UserCreateBody) => apiRequest<User>('/api/users/', { method: 'POST', body }),
  update: (id: string, body: UserPatchBody) => apiRequest<User>(`/api/users/${id}/`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<undefined>(`/api/users/${id}/`, { method: 'DELETE' }),
};
