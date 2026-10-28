import { AuthProvider } from '@/features/auth';
import { PushNotifications } from '@/features/notifications/push-notifications';
import { LayoutOverrideProvider, ThemeProvider } from '@/shared/theme';
import { AppStack } from '@/shared/ui/app-stack';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutOverrideProvider>
        <AuthProvider>
          <PushNotifications>
            <AppStack />
            {/* {__DEV__ ? <LayoutPreviewBar /> : null} */}
          </PushNotifications>
        </AuthProvider>
      </LayoutOverrideProvider>
    </ThemeProvider>
  );
}
