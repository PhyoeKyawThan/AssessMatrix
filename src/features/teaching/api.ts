import { apiRequest } from '@/shared/api/client';
import { qs } from '@/shared/api/query';
import type { Page } from '@/shared/api/use-resource';

export type PlanStatus = 'DRAFT' | 'PUBLISHED';
export type DistributionStatus = 'PENDING' | 'COMPLETED';
export type AssessmentStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'GRADED';

export const ASSESSMENT_TYPES = ['QUIZ', 'ASSIGNMENT', 'LAB', 'PRESENTATION', 'MIDTERM', 'FINAL'] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

export interface LecturePlan {
  id: string;
  module_id: string;
  module: { id: string; module_code: string; module_name: string; credit_hours: number };
  lecturer_id: string;
  lecturer: { id: string; full_name: string; email: string };
  academic_id: string;
  academic_year: string;
  note: string;
  status: PlanStatus;
  percentage_total: number;
}

export interface AssessmentDistribution {
  id: string;
  lecture_plan_id: string;
  assessment_type: AssessmentType;
  percentage: number;
  total_assessment: number;
  display_order: number;
  status: DistributionStatus;
  assessment_count: number;
}

export interface Assessment {
  id: string;
  assessment_distribution_id: string;
  lecture_plan_id: string;
  module_id: string;
  assessment_type: AssessmentType;
  title: string;
  sequence_no: number;
  max_mark: string;
  assessment_date: string | null;
  due_at: string | null;
  status: AssessmentStatus;
  distribution_status: DistributionStatus;
  /** Only present on the `mark-graded` response. */
  run_finished?: boolean;
}

export interface AssessmentInput {
  title: string;
  sequence_no: number;
  max_mark: string;
  assessment_date?: string | null;
  due_at?: string | null;
}

export interface AssessmentCreate extends AssessmentInput {
  assessment_distribution_id: string;
}

export const teachingApi = {
  plans: {
    list: (params: {
      module_id?: string;
      lecturer_id?: string;
      academic_id?: string;
      status?: string;
      page?: number;
      page_size?: number;
    } = {}) => apiRequest<Page<LecturePlan>>(`/api/lecture-plans/${qs(params)}`),
    mine: (params: { status?: string; academic_id?: string; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<LecturePlan>>(`/api/me/lecture-plans/${qs(params)}`),
    get: (id: string) => apiRequest<LecturePlan>(`/api/lecture-plans/${id}/`),
    create: (body: { module_id: string; lecturer_id?: string; note?: string }) =>
      apiRequest<LecturePlan>('/api/lecture-plans/', { method: 'POST', body }),
    update: (id: string, body: { note?: string; lecturer_id?: string }) =>
      apiRequest<LecturePlan>(`/api/lecture-plans/${id}/`, { method: 'PATCH', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/lecture-plans/${id}/`, { method: 'DELETE' }),
    publish: (id: string) => apiRequest<LecturePlan>(`/api/lecture-plans/${id}/publish/`, { method: 'POST', body: {} }),
    revert: (id: string) =>
      apiRequest<LecturePlan>(`/api/lecture-plans/${id}/revert-to-draft/`, { method: 'POST', body: {} }),
  },
  distributions: {
    list: (lecturePlanId: string, page = 1) =>
      apiRequest<Page<AssessmentDistribution>>(`/api/assessment-distributions/${qs({ lecture_plan_id: lecturePlanId, page })}`),
    create: (body: {
      lecture_plan_id: string;
      assessment_type: AssessmentType;
      percentage: number;
      total_assessment: number;
      display_order: number;
    }) => apiRequest<AssessmentDistribution>('/api/assessment-distributions/', { method: 'POST', body }),
    update: (id: string, body: Record<string, string | number>) =>
      apiRequest<AssessmentDistribution>(`/api/assessment-distributions/${id}/`, { method: 'PATCH', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/assessment-distributions/${id}/`, { method: 'DELETE' }),
  },
  assessments: {
    list: (params: {
      assessment_distribution_id?: string;
      lecture_plan_id?: string;
      module_id?: string;
      status?: string;
      page?: number;
      page_size?: number;
    } = {}) => apiRequest<Page<Assessment>>(`/api/assessments/${qs(params)}`),
    get: (id: string) => apiRequest<Assessment>(`/api/assessments/${id}/`),
    create: (body: AssessmentCreate) => apiRequest<Assessment>('/api/assessments/', { method: 'POST', body }),
    update: (id: string, body: Partial<AssessmentInput>) =>
      apiRequest<Assessment>(`/api/assessments/${id}/`, { method: 'PATCH', body }),
    remove: (id: string) => apiRequest<undefined>(`/api/assessments/${id}/`, { method: 'DELETE' }),
    open: (id: string) => apiRequest<Assessment>(`/api/assessments/${id}/open/`, { method: 'POST', body: {} }),
    close: (id: string) => apiRequest<Assessment>(`/api/assessments/${id}/close/`, { method: 'POST', body: {} }),
    markGraded: (id: string) =>
      apiRequest<Assessment>(`/api/assessments/${id}/mark-graded/`, { method: 'POST', body: {} }),
  },
};
