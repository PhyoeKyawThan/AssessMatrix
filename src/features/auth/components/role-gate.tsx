import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { HOME_BY_ROLE, SIGN_IN_HREF } from '@/features/auth/routes';
import type { Role } from '@/features/auth/types';
import { SessionLoader } from '@/shared/ui/session-loader';

export function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const { status, user } = useAuth();

  if (status === 'restoring') return <SessionLoader label="Restoring your session…" />;
  if (status === 'signed-out' || user === null) return <Redirect href={SIGN_IN_HREF} />;
  if (user.role !== role) return <Redirect href={HOME_BY_ROLE[user.role]} />;

  return <>{children}</>;
}
