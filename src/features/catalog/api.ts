import { apiRequest } from '@/shared/api/client';
import { qs } from '@/shared/api/query';
import type { Page } from '@/shared/api/use-resource';

export interface Academic {
  id: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Semester {
  id: string;
  academic_id: string;
  academic_year: string;
  semester_no: number;
  semester_name: string;
  start_date: string;
  end_date: string;
}

export interface Module {
  id: string;
  semester_id: string;
  academic_id: string;
  academic_year: string;
  module_code: string;
  module_name: string;
  credit_hours: number;
}

export type EnrollmentStatus = 'ENROLLED' | 'DROPPED' | 'COMPLETED';

export interface Enrollment {
  id: string;
  student_id: string;
  module_id: string;
  student: { id: string; full_name: string; email: string };
  module: { id: string; module_code: string; module_name: string };
  status: EnrollmentStatus;
  enrolled_at: string;
}

export interface EnrollmentBulkResult {
  created: string[];
  skipped: { student_id: string; reason: string }[];
}

/** Contract paths for academics, semesters, modules and enrollments. */
export const catalogApi = {
  academics: {
    list: (params: { is_current?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<Academic>>(`/api/academics/${qs(params)}`),
    create: (body: Omit<Academic, 'id'>) => apiRequest<Academic>('/api/academics/', { method: 'POST', body }),
    update: (id: string, body: Partial<Omit<Academic, 'id'>>) =>
      apiRequest<Academic>(`/api/academics/${id}/`, { method: 'PATCH', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/academics/${id}/`, { method: 'DELETE' }),
  },
  semesters: {
    list: (params: { academic_id?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<Semester>>(`/api/semesters/${qs(params)}`),
    create: (body: { academic_id: string; semester_no: number; semester_name: string; start_date: string; end_date: string }) =>
      apiRequest<Semester>('/api/semesters/', { method: 'POST', body }),
    update: (id: string, body: Record<string, string | number>) =>
      apiRequest<Semester>(`/api/semesters/${id}/`, { method: 'PATCH', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/semesters/${id}/`, { method: 'DELETE' }),
  },
  modules: {
    list: (params: { semester_id?: string; academic_id?: string; search?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<Module>>(`/api/modules/${qs(params)}`),
    create: (body: { semester_id: string; module_code: string; module_name: string; credit_hours: number }) =>
      apiRequest<Module>('/api/modules/', { method: 'POST', body }),
    update: (id: string, body: Record<string, string | number>) =>
      apiRequest<Module>(`/api/modules/${id}/`, { method: 'PATCH', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/modules/${id}/`, { method: 'DELETE' }),
  },
  enrollments: {
    list: (params: { module_id?: string; student_id?: string; academic_id?: string; status?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<Enrollment>>(`/api/enrollments/${qs(params)}`),
    mine: (page = 1) => apiRequest<Page<Enrollment>>(`/api/me/enrollments/${qs({ page })}`),
    create: (body: { student_id: string; module_id: string }) =>
      apiRequest<Enrollment>('/api/enrollments/', { method: 'POST', body }),
    setStatus: (id: string, status: EnrollmentStatus) =>
      apiRequest<Enrollment>(`/api/enrollments/${id}/`, { method: 'PATCH', body: { status } }),
    remove: (id: string) => apiRequest<undefined>(`/api/enrollments/${id}/`, { method: 'DELETE' }),
    bulk: (body: { module_id: string; student_ids: string[] }) =>
      apiRequest<EnrollmentBulkResult>('/api/enrollments/bulk/', { method: 'POST', body }),
  },
};
