import { AuthProvider } from '@/features/auth';
import { PushNotifications } from '@/features/notifications/push-notifications';
import { LayoutOverrideProvider, ThemeProvider } from '@/shared/theme';
import { AppStack } from '@/shared/ui/app-stack';
import { I18nProvider } from '@/shared/i18n';

export default function RootLayout() {
  return (
    <I18nProvider>
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
    </I18nProvider>
  );
}
