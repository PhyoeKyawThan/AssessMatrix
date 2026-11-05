import { apiRequest, apiUpload } from '@/shared/api/client';
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
        official_raw_mark: string | null;
        official_result_locked_at: string | null;
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

export type UserImportStatus = 'READY' | 'DUPLICATE' | 'INVALID';

export interface UserImportRow {
  row_number: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  status: UserImportStatus;
  message: string;
}

export interface UserImportPreview {
  summary: { total: number; ready: number; duplicates: number; invalid: number };
  issues: UserImportRow[];
  sample: UserImportRow[];
  issues_truncated: boolean;
}

export interface UserImportResult {
  created_count: number;
  skipped_count: number;
  summary: UserImportPreview['summary'];
  duplicates: UserImportRow[];
}

export interface UploadAsset {
  uri: string;
  name: string;
  type: string;
  webFile?: File;
}

function uploadWorkbook<T>(path: string, asset: UploadAsset) {
  const form = new FormData();
  form.append('file', asset.webFile ?? ({
    uri: asset.uri, name: asset.name, type: asset.type,
  } as unknown as Blob));
  return apiUpload<T>(path, form);
}

export const usersApi = {
  list: (params: { role?: string; is_active?: string; placement_status?: 'placed' | 'unplaced'; search?: string; page?: number; page_size?: number } = {}) =>
    apiRequest<Page<User>>(`/api/users/${qs(params)}`),
  get: (id: string) => apiRequest<User>(`/api/users/${id}/`),
  create: (body: UserCreateBody) => apiRequest<User>('/api/users/', { method: 'POST', body }),
  update: (id: string, body: UserPatchBody) => apiRequest<User>(`/api/users/${id}/`, { method: 'PATCH', body }),
  remove: (id: string) => apiRequest<undefined>(`/api/users/${id}/`, { method: 'DELETE' }),
  academicHistory: (id: string) => apiRequest<AcademicHistory>(`/api/users/${id}/academic-history/`),
  myAcademicHistory: () => apiRequest<AcademicHistory>('/api/me/academic-history/'),
  previewImport: (asset: UploadAsset) => uploadWorkbook<UserImportPreview>('/api/users/import-preview/', asset),
  commitImport: (asset: UploadAsset) => uploadWorkbook<UserImportResult>('/api/users/import-commit/', asset),
};
