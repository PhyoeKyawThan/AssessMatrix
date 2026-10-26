import { RoleGate } from '@/features/auth';
import { AppStack } from '@/shared/ui/app-stack';

export default function TeacherLayout() {
  return (
    <RoleGate role="TEACHER">
      <AppStack />
    </RoleGate>
  );
}
