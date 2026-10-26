import { AuthProvider } from '@/features/auth';
import { AppStack } from '@/shared/ui/app-stack';
import { ThemeProvider } from '@/shared/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
