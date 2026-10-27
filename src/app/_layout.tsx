import { AuthProvider } from '@/features/auth';
import { LayoutOverrideProvider, ThemeProvider } from '@/shared/theme';
import { AppStack } from '@/shared/ui/app-stack';
import { LayoutPreviewBar } from '@/shared/ui/layout-preview-bar';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutOverrideProvider>
        <AuthProvider>
          <AppStack />
          {__DEV__ ? <LayoutPreviewBar /> : null}
        </AuthProvider>
      </LayoutOverrideProvider>
    </ThemeProvider>
  );
}
