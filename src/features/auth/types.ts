export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

/** GET /api/me/ representation. The API never returns the password. */
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  is_staff: boolean;
  last_login: string | null;
  date_joined: string;
  /** Whether this account has a device registered for push. The token itself never comes back. */
  has_push_token: boolean;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
};
