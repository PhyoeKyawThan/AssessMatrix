import { RoleGate } from '@/features/auth';
import { AppStack } from '@/shared/ui/app-stack';

export default function StudentLayout() {
  return (
    <RoleGate role="STUDENT">
      <AppStack />
    </RoleGate>
  );
}
