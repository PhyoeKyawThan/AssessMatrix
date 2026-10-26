import { Redirect } from 'expo-router';

import { HOME_BY_ROLE, SIGN_IN_HREF, useAuth } from '@/features/auth';
import { SessionLoader } from '@/shared/ui/session-loader';

export default function Index() {
  const { status, user } = useAuth();

  if (status === 'restoring') return <SessionLoader label="Restoring your session…" />;
  if (status === 'signed-in' && user !== null) return <Redirect href={HOME_BY_ROLE[user.role]} />;

  return <Redirect href={SIGN_IN_HREF} />;
}
