import type { Href } from 'expo-router';

import type { Role } from '@/features/auth/types';
import type { IconName } from '@/shared/ui/icon';

export interface NavItem {
  href: Href;
  label: string;
  /** Short label for the phone tab bar, where the full one does not fit. */
  tabLabel: string;
  icon: IconName;
}

/** One entry per screen a role can reach; the shell renders it as a sidebar, a rail or tabs. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: '/admin', label: 'Dashboard', tabLabel: 'Home', icon: 'grid' },
    { href: '/admin/users', label: 'Users', tabLabel: 'Users', icon: 'users' },
    { href: '/admin/academics', label: 'Academic years', tabLabel: 'Years', icon: 'calendar' },
    { href: '/admin/semesters', label: 'Semesters', tabLabel: 'Terms', icon: 'calendar' },
    { href: '/admin/modules', label: 'Modules', tabLabel: 'Modules', icon: 'layers' },
    { href: '/admin/enrollments', label: 'Enrollments', tabLabel: 'Enrols', icon: 'clipboard' },
    { href: '/admin/plans', label: 'Lecture plans', tabLabel: 'Plans', icon: 'document' },
  ],
  TEACHER: [
    { href: '/teacher', label: 'Dashboard', tabLabel: 'Home', icon: 'grid' },
    { href: '/teacher/plans', label: 'My plans', tabLabel: 'Plans', icon: 'document' },
    { href: '/teacher/assessments', label: 'Assessments', tabLabel: 'Assess', icon: 'checklist' },
    { href: '/teacher/results', label: 'Marks entry', tabLabel: 'Marks', icon: 'chart' },
  ],
  STUDENT: [
    { href: '/student', label: 'Dashboard', tabLabel: 'Home', icon: 'grid' },
    { href: '/student/enrollments', label: 'My modules', tabLabel: 'Modules', icon: 'layers' },
    { href: '/student/plans', label: 'Published plans', tabLabel: 'Plans', icon: 'document' },
    { href: '/student/results', label: 'My marks', tabLabel: 'Marks', icon: 'chart' },
  ],
};

/** Tabs a phone shows before the remaining sections collapse into an overflow sheet. */
export const VISIBLE_TABS = 4;
