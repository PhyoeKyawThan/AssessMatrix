import { apiRequest } from '@/shared/api/client';
import { qs } from '@/shared/api/query';
import type { Page } from '@/shared/api/use-resource';
import type { User } from '@/features/users/api';

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

export interface Major {
  id: string;
  code: string;
  name: string;
  duration_years: 4 | 5;
  is_active: boolean;
}

export interface StudentPlacement {
  id: string;
  student_id: string;
  student: { id: string; full_name: string; email: string };
  semester_id: string;
  academic_id: string;
  academic_year: string;
  semester_no: number;
  semester_name: string;
  major_id: string;
  major: Major;
  study_year: number;
  admitted_on: string;
  is_current: boolean;
  created_at: string;
}

export interface Module {
  id: string;
  semester_id: string;
  academic_id: string;
  academic_year: string;
  module_code: string;
  module_name: string;
  study_year: number;
  eligible_major_ids: string[];
  eligible_majors: Major[];
  /** Null until an admin offers the module to a teacher. */
  lecture_plan: { id: string; status: string; lecturer: { id: string; full_name: string; email: string } } | null;
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
  majors: {
    list: (params: { is_active?: string; search?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<Major>>(`/api/majors/${qs(params)}`),
    create: (body: Omit<Major, 'id'>) => apiRequest<Major>('/api/majors/', { method: 'POST', body }),
    update: (id: string, body: Partial<Omit<Major, 'id'>>) =>
      apiRequest<Major>(`/api/majors/${id}/`, { method: 'PATCH', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/majors/${id}/`, { method: 'DELETE' }),
  },
  modules: {
    list: (params: {
      semester_id?: string;
      academic_id?: string;
      lecturer_id?: string;
      major_id?: string;
      study_year?: number;
      current_year?: string;
      planned?: string;
      search?: string;
      page?: number;
      page_size?: number;
    } = {}) => apiRequest<Page<Module>>(`/api/modules/${qs(params)}`),
    create: (body: { semester_id: string; study_year: number; module_code: string; module_name: string; eligible_major_ids?: string[] }) =>
      apiRequest<Module>('/api/modules/', { method: 'POST', body }),
    update: (id: string, body: { semester_id?: string; study_year?: number; module_code?: string; module_name?: string; eligible_major_ids?: string[] }) =>
      apiRequest<Module>(`/api/modules/${id}/`, { method: 'PATCH', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/modules/${id}/`, { method: 'DELETE' }),
    copy: (id: string, targetSemesterId: string) =>
      apiRequest<Module>(`/api/modules/${id}/copy/`, { method: 'POST', body: { target_semester_id: targetSemesterId } }),
    eligibleStudents: (id: string, params: { search?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<Pick<User, 'id' | 'full_name' | 'email'>>>(`/api/modules/${id}/eligible-students/${qs(params)}`),
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
  placements: {
    list: (params: { student_id?: string; semester_id?: string; academic_id?: string; major_id?: string; study_year?: number; is_current?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<StudentPlacement>>(`/api/student-placements/${qs(params)}`),
    create: (body: { student_id: string; semester_id: string; major_id: string; study_year: number; admitted_on: string; is_current?: boolean }) =>
      apiRequest<StudentPlacement>('/api/student-placements/', { method: 'POST', body }),
    update: (id: string, body: Partial<{ semester_id: string; major_id: string; study_year: number; admitted_on: string; is_current: boolean }>) =>
      apiRequest<StudentPlacement>(`/api/student-placements/${id}/`, { method: 'PATCH', body }),
    promote: (body: { student_ids: string[]; target_semester_id: string; target_study_year: number; major_id?: string }) =>
      apiRequest<StudentPlacement[]>('/api/student-placements/promote/', { method: 'POST', body }),
  },
};

export type AcademicSetupData = {
  academic?: { academic_year: string; start_date: string; end_date: string };
  semesters?: { semester_no: 1 | 2; semester_name: string; start_date: string; end_date: string }[];
  majors?: { code: string; name: string; duration_years: 4 | 5 }[];
  modules?: { module_code: string; module_name: string; study_year: number; semester_no: 1 | 2; major_codes: string[] }[];
};

export interface AcademicSetupDraft {
  id: string;
  name: string;
  current_step: number;
  data: AcademicSetupData;
  status: 'DRAFT' | 'PUBLISHED' | 'DISCARDED';
  created_at: string;
  updated_at: string;
}

export const setupApi = {
  list: (page = 1) => apiRequest<Page<AcademicSetupDraft>>(`/api/academic-setup-drafts/${qs({ page })}`),
  create: (body: { name: string; current_step: number; data: AcademicSetupData }) =>
    apiRequest<AcademicSetupDraft>('/api/academic-setup-drafts/', { method: 'POST', body }),
  update: (id: string, body: Partial<{ name: string; current_step: number; data: AcademicSetupData }>) =>
    apiRequest<AcademicSetupDraft>(`/api/academic-setup-drafts/${id}/`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<undefined>(`/api/academic-setup-drafts/${id}/`, { method: 'DELETE' }),
  publish: (id: string) => apiRequest<{ draft: AcademicSetupDraft; academic_id: string; semester_ids: string[]; module_ids: string[] }>(`/api/academic-setup-drafts/${id}/publish/`, { method: 'POST', body: {} }),
};
