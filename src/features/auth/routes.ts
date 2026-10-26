import type { Href } from 'expo-router';

import type { Role } from '@/features/auth/types';

export const SIGN_IN_HREF: Href = '/sign-in';

/** The API decides the role from the account, so each role lands on its own route group. */
export const HOME_BY_ROLE: Record<Role, Href> = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
};
