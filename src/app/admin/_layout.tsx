import { RoleGate } from '@/features/auth';
import { AppStack } from '@/shared/ui/app-stack';

export default function AdminLayout() {
  return (
    <RoleGate role="ADMIN">
      <AppStack />
    </RoleGate>
  );
}
