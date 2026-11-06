import { RoleGate } from '@/features/auth';
import { AppShell } from '@/features/shell';
import { AppStack } from '@/shared/ui/app-stack';
import { PageSkeleton } from '@/shared/ui/skeleton';

export function SuspenseFallback() {
  return <PageSkeleton />;
}

export default function TeacherLayout() {
  return (
    <RoleGate role="TEACHER">
      <AppShell role="TEACHER">
        <AppStack />
      </AppShell>
    </RoleGate>
  );
}
