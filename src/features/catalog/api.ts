import { apiRequest } from '@/shared/api/client';
import { qs } from '@/shared/api/query';
import type { Page } from '@/shared/api/use-resource';
import type { User } from '@/features/users/api';

export type TeachingPeriodStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface TeachingPeriod {
  id: string;
  academic_label: string;
  period_number: 1 | 2;
  name: string;
  start_date: string;
  end_date: string;
  status: TeachingPeriodStatus;
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
  programme_semester: number;
  teaching_period_status: TeachingPeriodStatus;
  admitted_on: string;
  is_current: boolean;
  created_at: string;
}

export interface Module {
  id: string;
  semester_id: string;
  academic_id: string;
  academic_year: string;
  teaching_period_name: string;
  period_number: 1 | 2;
  teaching_period_status: TeachingPeriodStatus;
  module_code: string;
  module_name: string;
  definition_id: string;
  study_year: number;
  eligible_major_ids: string[];
  eligible_majors: Major[];
  /** Null until an admin offers the module to a teacher. */
  lecture_plan: { id: string; status: string; lecturer: { id: string; full_name: string; email: string } } | null;
}

export interface ModuleDefinition {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurriculumModule {
  id: string;
  curriculum_id: string;
  module_definition_id: string;
  module_code: string;
  module_name: string;
  semester_number: number;
  study_year: number;
  term_number: 1 | 2;
}

export interface CurriculumVersion {
  id: string;
  major_id: string;
  major_code: string;
  name: string;
  effective_from_id: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  created_at: string;
  module_slots: CurriculumModule[];
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

export interface PlacementBulkResult {
  created_count: number;
  created: string[];
  skipped: { student_id: string; reason: string }[];
}

/** Contract paths for academics, semesters, modules and enrollments. */
export const catalogApi = {
  teachingPeriods: {
    list: (params: { academic_label?: string; status?: TeachingPeriodStatus; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<TeachingPeriod>>(`/api/teaching-periods/${qs(params)}`),
    create: (body: Omit<TeachingPeriod, 'id'>) =>
      apiRequest<TeachingPeriod>('/api/teaching-periods/', { method: 'POST', body }),
    update: (id: string, body: Partial<Omit<TeachingPeriod, 'id'>>) =>
      apiRequest<TeachingPeriod>(`/api/teaching-periods/${id}/`, { method: 'PATCH', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/teaching-periods/${id}/`, { method: 'DELETE' }),
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
    create: (body: { semester_id: string; study_year: number; definition_id?: string; module_code: string; module_name: string; eligible_major_ids?: string[] }) =>
      apiRequest<Module>('/api/modules/', { method: 'POST', body }),
    update: (id: string, body: { semester_id?: string; study_year?: number; definition_id?: string; module_code?: string; module_name?: string; eligible_major_ids?: string[] }) =>
      apiRequest<Module>(`/api/modules/${id}/`, { method: 'PATCH', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/modules/${id}/`, { method: 'DELETE' }),
    copy: (id: string, targetSemesterId: string) =>
      apiRequest<Module>(`/api/modules/${id}/copy/`, { method: 'POST', body: { target_semester_id: targetSemesterId } }),
    eligibleStudents: (id: string, params: { search?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<Pick<User, 'id' | 'full_name' | 'email'>>>(`/api/modules/${id}/eligible-students/${qs(params)}`),
  },
  moduleDefinitions: {
    list: (params: { is_active?: string; search?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<ModuleDefinition>>(`/api/module-definitions/${qs(params)}`),
    create: (body: { code: string; name: string; is_active?: boolean }) =>
      apiRequest<ModuleDefinition>('/api/module-definitions/', { method: 'POST', body }),
    update: (id: string, body: Partial<Pick<ModuleDefinition, 'code' | 'name' | 'is_active'>>) =>
      apiRequest<ModuleDefinition>(`/api/module-definitions/${id}/`, { method: 'PATCH', body }),
  },
  curricula: {
    list: (params: { major_id?: string; status?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<CurriculumVersion>>(`/api/curricula/${qs(params)}`),
    get: (id: string) => apiRequest<CurriculumVersion>(`/api/curricula/${id}/`),
    create: (body: { major_id: string; name: string; effective_from_id?: string | null; status?: CurriculumVersion['status'] }) =>
      apiRequest<CurriculumVersion>('/api/curricula/', { method: 'POST', body }),
    generateOfferings: (id: string, teachingPeriodId: string, programmeSemester: number) =>
      apiRequest<Module[]>(`/api/curricula/${id}/generate-offerings/`, {
        method: 'POST',
        body: { teaching_period_id: teachingPeriodId, programme_semester: programmeSemester },
      }),
  },
  curriculumModules: {
    create: (body: { curriculum_id: string; module_definition_id: string; semester_number: number }) =>
      apiRequest<CurriculumModule>('/api/curriculum-modules/', { method: 'POST', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/curriculum-modules/${id}/`, { method: 'DELETE' }),
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
    bulk: (body: {
      student_ids?: string[];
      all_unplaced?: boolean;
      teaching_period_id: string;
      major_id: string;
      programme_semester: number;
      admitted_on: string;
    }) => apiRequest<PlacementBulkResult>('/api/student-placements/bulk/', { method: 'POST', body }),
    update: (id: string, body: Partial<{ semester_id: string; major_id: string; study_year: number; admitted_on: string; is_current: boolean }>) =>
      apiRequest<StudentPlacement>(`/api/student-placements/${id}/`, { method: 'PATCH', body }),
    promote: (body: { student_ids: string[]; target_semester_id: string; target_study_year: number; major_id?: string }) =>
      apiRequest<StudentPlacement[]>('/api/student-placements/promote/', { method: 'POST', body }),
  },
};
