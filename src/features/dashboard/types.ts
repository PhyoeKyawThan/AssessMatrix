import type { Tone } from '@/shared/theme';

export type RoleKey = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface Stat {
  key: string;
  label: string;
  value: string;
  tone: Tone;
}

export interface Slice {
  key: string;
  label: string;
  value: number;
}

export interface Donut {
  title: string;
  total: number;
  slices: Slice[];
}

export interface BarSeries {
  key: string;
  label: string;
  tone: Tone;
}

export interface BarGroup {
  label: string;
  values: Record<string, number | string>;
}

export interface Bars {
  title: string;
  series: BarSeries[];
  groups: BarGroup[];
}

export interface RecentModule {
  id: string;
  module_code: string;
  module_name: string;
  credit_hours: number;
  semester: string;
  academic_year: string;
}

export interface RecentEnrollment {
  id: string;
  student: string;
  module_code: string;
  module_name: string;
  semester: string;
  status: string;
  status_label: string;
  enrolled_at: string;
}

export interface UpcomingAssessment {
  id: string;
  title: string;
  type: string;
  type_label: string;
  sequence_no: number;
  max_mark: string;
  assessment_date: string | null;
  status: string;
  status_label: string;
  module_code: string;
  module_name: string;
}

export interface RecentMark {
  id: string;
  marks_obtained: string;
  max_mark: string;
  percentage: string | null;
  remark: string;
  graded_at: string;
  assessment_title: string;
  module_code: string;
  module_name: string;
  student: string;
}

/** `GET /api/dashboard/`. The extra keys depend on `role`. */
export interface Dashboard {
  role: RoleKey;
  stats: Stat[];
  donut: Donut;
  bars: Bars;
  recent_modules?: RecentModule[];
  recent_enrollments?: RecentEnrollment[];
  upcoming_assessments?: UpcomingAssessment[];
  recent_marks?: RecentMark[];
}
