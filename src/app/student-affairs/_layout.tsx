import { RoleGate } from '@/features/auth';
import { AppShell } from '@/features/shell';
import { AppStack } from '@/shared/ui/app-stack';

export default function StudentAffairsLayout() {
  return (
    <RoleGate role="STUDENT_AFFAIRS">
      <AppShell role="STUDENT_AFFAIRS">
        <AppStack />
      </AppShell>
    </RoleGate>
  );
}
