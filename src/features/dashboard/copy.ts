import type { Role } from '@/features/auth/types';

interface RoleCopy {
  title: string;
  summary: string;
  next: string[];
}

export const ROLE_COPY: Record<Role, RoleCopy> = {
  ADMIN: {
    title: 'Administration',
    summary: 'Manage users and the academic catalog.',
    next: ['Users — /api/users/', 'Academics — /api/academics/', 'Semesters — /api/semesters/', 'Modules — /api/modules/'],
  },
  TEACHER: {
    title: 'Teaching',
    summary: 'Own lecture plans, assessments and marks.',
    next: ['Lecture plans — /api/lecture-plans/', 'Enrollments for own modules — /api/enrollments/'],
  },
  STUDENT: {
    title: 'My studies',
    summary: 'See the modules you are enrolled in and your marks.',
    next: ['Enrollments — /api/me/enrollments/', 'Marks — own assessment results'],
  },
};
