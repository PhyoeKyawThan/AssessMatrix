import { apiRequest } from '@/shared/api/client';
import { qs } from '@/shared/api/query';
import type { Role, SessionUser } from '@/features/auth/types';
import type { Page } from '@/shared/api/use-resource';

export type User = SessionUser;

export interface AcademicHistoryResult {
  id: string;
  assessment_id: string;
  assessment_type: string;
  title: string;
  sequence_no: number;
  marks_obtained: string;
  max_mark: string;
  remark: string;
  graded_at: string;
  graded_by: string;
}

export interface AcademicHistory {
  student: User;
  academic_years: {
    academic_id: string;
    academic_year: string;
    semesters: {
      semester_id: string;
      semester_no: number;
      semester_name: string;
      modules: {
        enrollment_id: string;
        module_id: string;
        module_code: string;
        module_name: string;
        study_year: number;
        status: string;
        teacher: string | null;
        obtained_total: string;
        maximum_total: string;
        results: AcademicHistoryResult[];
      }[];
    }[];
  }[];
}

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
  get: (id: string) => apiRequest<User>(`/api/users/${id}/`),
  create: (body: UserCreateBody) => apiRequest<User>('/api/users/', { method: 'POST', body }),
  update: (id: string, body: UserPatchBody) => apiRequest<User>(`/api/users/${id}/`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<undefined>(`/api/users/${id}/`, { method: 'DELETE' }),
  academicHistory: (id: string) => apiRequest<AcademicHistory>(`/api/users/${id}/academic-history/`),
  myAcademicHistory: () => apiRequest<AcademicHistory>('/api/me/academic-history/'),
};
