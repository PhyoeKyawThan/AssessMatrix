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
};
