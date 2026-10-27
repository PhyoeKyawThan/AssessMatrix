import { RoleGate } from '@/features/auth';
import { AppShell } from '@/features/shell';
import { AppStack } from '@/shared/ui/app-stack';

export default function TeacherLayout() {
  return (
    <RoleGate role="TEACHER">
      <AppShell role="TEACHER">
        <AppStack />
      </AppShell>
    </RoleGate>
  );
}
