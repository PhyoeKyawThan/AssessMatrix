import { RoleGate } from '@/features/auth';
import { AppShell } from '@/features/shell';
import { AppStack } from '@/shared/ui/app-stack';
import { PageSkeleton } from '@/shared/ui/skeleton';

export function SuspenseFallback() {
  return <PageSkeleton />;
}

export default function StudentLayout() {
  return (
    <RoleGate role="STUDENT">
      <AppShell role="STUDENT">
        <AppStack />
      </AppShell>
    </RoleGate>
  );
}
