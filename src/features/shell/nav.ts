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
    { href: '/admin/setup', label: 'Academic setup', tabLabel: 'Setup', icon: 'calendar' },
    { href: '/admin/users', label: 'Users', tabLabel: 'Users', icon: 'users' },
    { href: '/admin/cohorts', label: 'Student cohorts', tabLabel: 'Cohorts', icon: 'userPlus' },
    { href: '/admin/academics', label: 'Academic years', tabLabel: 'Years', icon: 'calendar' },
    { href: '/admin/semesters', label: 'Semesters', tabLabel: 'Terms', icon: 'clock' },
    { href: '/admin/majors', label: 'Majors', tabLabel: 'Majors', icon: 'layers' },
    { href: '/admin/modules', label: 'Modules', tabLabel: 'Modules', icon: 'book' },
    { href: '/admin/plans', label: 'Module assignments', tabLabel: 'Assign', icon: 'document' },
    { href: '/admin/enrollments', label: 'Enrollments', tabLabel: 'Enrols', icon: 'clipboard' },
  ],
  TEACHER: [
    { href: '/teacher', label: 'Dashboard', tabLabel: 'Home', icon: 'grid' },
    { href: '/teacher/plans', label: 'Assigned modules', tabLabel: 'Modules', icon: 'document' },
    { href: '/teacher/assessments', label: 'Assessments', tabLabel: 'Assess', icon: 'checklist' },
    { href: '/teacher/results', label: 'Marks entry', tabLabel: 'Marks', icon: 'chart' },
  ],
  STUDENT: [
    { href: '/student', label: 'Dashboard', tabLabel: 'Home', icon: 'grid' },
    { href: '/student/enrollments', label: 'My modules', tabLabel: 'Modules', icon: 'book' },
    { href: '/student/plans', label: 'Published plans', tabLabel: 'Plans', icon: 'document' },
    { href: '/student/results', label: 'My marks', tabLabel: 'Marks', icon: 'chart' },
  ],
};

/** Tabs a phone shows before the remaining sections collapse into an overflow sheet. */
export const VISIBLE_TABS = 4;

/**
 * The section a pathname belongs to. The role home is an exact match because every other admin
 * path starts with `/admin`, and a phone tab bar has no home prefix to compare against.
 */
export function isSectionActive(pathname: string, items: NavItem[], item: NavItem): boolean {
  const target = targetOf(item);
  if (target === targetOf(items[0])) return pathname === target;
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function targetOf(item: NavItem): string {
  return typeof item.href === 'string' ? item.href : item.href.pathname;
}
