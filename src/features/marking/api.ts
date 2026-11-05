import { apiRequest } from '@/shared/api/client';
import { qs } from '@/shared/api/query';
import type { Page } from '@/shared/api/use-resource';

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  enrollment_id: string;
  marks_obtained: string;
  remark: string;
  graded_by: { id: string; full_name: string };
  graded_at: string;
  max_mark: string;
  percentage: string;
}

export interface BulkResultRow {
  enrollment_id: string;
  marks_obtained: string;
  remark?: string;
}

export type ResultSheetStatus = 'DRAFT' | 'SUBMITTED' | 'RETURNED' | 'VERIFIED' | 'LOCKED';

export interface PeriodResultRow {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  student_number: string;
  raw_mark: string;
  maximum_mark: string | null;
  remark: string;
}

export interface ModuleResultSheet {
  id: string;
  module_id: string;
  module_code: string;
  module_name: string;
  semester_id: string;
  semester_name: string;
  academic_id: string;
  academic_year: string;
  lecturer_id: string;
  lecturer_name: string;
  status: ResultSheetStatus;
  revision: number;
  enrolled_count: number;
  marked_count: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  returned_comment: string;
  locked_at: string | null;
  updated_at: string;
  roster: PeriodResultRow[];
}

export interface SavePeriodResultRow {
  enrollment_id: string;
  raw_mark: string;
  maximum_mark?: string | null;
  remark?: string;
}

export const markingApi = {
  list: (params: {
    assessment_id?: string;
    enrollment_id?: string;
    module_id?: string;
    student_id?: string;
    page?: number;
    page_size?: number;
  } = {}) => apiRequest<Page<AssessmentResult>>(`/api/assessment-results/${qs(params)}`),
  create: (body: { assessment_id: string; enrollment_id: string; marks_obtained: string; remark?: string }) =>
    apiRequest<AssessmentResult>('/api/assessment-results/', { method: 'POST', body }),
  update: (id: string, body: { marks_obtained?: string; remark?: string }) =>
    apiRequest<AssessmentResult>(`/api/assessment-results/${id}/`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<undefined>(`/api/assessment-results/${id}/`, { method: 'DELETE' }),
  bulk: (body: { assessment_id: string; results: BulkResultRow[] }) =>
    apiRequest<AssessmentResult[]>('/api/assessment-results/bulk/', { method: 'POST', body }),
  sheets: {
    list: (params: { status?: ResultSheetStatus; page?: number; page_size?: number } = {}) =>
      apiRequest<Page<ModuleResultSheet>>(`/api/module-result-sheets/${qs(params)}`),
    get: (id: string) => apiRequest<ModuleResultSheet>(`/api/module-result-sheets/${id}/`),
    saveMarks: (id: string, results: SavePeriodResultRow[]) =>
      apiRequest(`/api/module-result-sheets/${id}/save-marks/`, { method: 'POST', body: { results } }),
    submit: (id: string) => apiRequest<ModuleResultSheet>(`/api/module-result-sheets/${id}/submit/`, { method: 'POST' }),
    verify: (id: string) => apiRequest<ModuleResultSheet>(`/api/module-result-sheets/${id}/verify/`, { method: 'POST' }),
    lock: (id: string) => apiRequest<ModuleResultSheet>(`/api/module-result-sheets/${id}/lock/`, { method: 'POST' }),
    returnForRevision: (id: string, comment: string) => apiRequest<ModuleResultSheet>(
      `/api/module-result-sheets/${id}/return-for-revision/`, { method: 'POST', body: { comment } },
    ),
    unlock: (id: string, comment: string) => apiRequest<ModuleResultSheet>(
      `/api/module-result-sheets/${id}/unlock/`, { method: 'POST', body: { comment } },
    ),
  },
};
