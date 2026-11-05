import type { Role } from '@/features/auth/types';
import type { BadgeTone } from '@/shared/ui/badge';

interface RoleCopy {
  title: string;
  summary: string;
}

export const ROLE_COPY: Record<Role, RoleCopy> = {
  ADMIN: { title: 'Administration', summary: 'Manage users, the academic catalog and lecture plans.' },
  STUDENT_AFFAIRS: { title: 'Student Affairs', summary: 'Review, verify, and publish official period results.' },
  TEACHER: { title: 'Teaching', summary: 'Own lecture plans, assessments and marks.' },
  STUDENT: { title: 'My studies', summary: 'See the modules you are enrolled in and your marks.' },
};

/** The dashboard mixes plan, assessment and enrollment statuses, so they share one lookup. */
const STATUS_TONE: Record<string, BadgeTone> = {
  ACTIVE: 'success',
  COMPLETED: 'neutral',
  CLOSED: 'warning',
  DRAFT: 'neutral',
  DROPPED: 'danger',
  ENROLLED: 'success',
  GRADED: 'success',
  OPEN: 'info',
  PUBLISHED: 'success',
  SCHEDULED: 'info',
  UNGRADED: 'warning',
};

export function statusBadgeTone(status: string): BadgeTone {
  return STATUS_TONE[status] ?? 'neutral';
}

/** The API sends percentages as decimal strings; 50 is the pass mark for every module. */
export function percentageTone(value: string | null): BadgeTone {
  if (value === null) return 'neutral';
  return Number.parseFloat(value) >= 50 ? 'success' : 'warning';
}
