import { RoleGate } from '@/features/auth';
import { AppShell } from '@/features/shell';
import { AppStack } from '@/shared/ui/app-stack';
import { PageSkeleton } from '@/shared/ui/skeleton';

export function SuspenseFallback() {
  return <PageSkeleton />;
}

export default function AdminLayout() {
  return (
    <RoleGate role="ADMIN">
      <AppShell role="ADMIN">
        <AppStack />
      </AppShell>
    </RoleGate>
  );
}
