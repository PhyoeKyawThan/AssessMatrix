import Constants from 'expo-constants';
import {
  addNotificationResponseReceivedListener,
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/features/auth';
import { notificationsApi } from '@/features/notifications/api';

/** Web push needs a service worker and VAPID keys, so registration stays on Android and iOS. */
const IS_PUSH_CAPABLE = Platform.OS !== 'web';

const CHANNEL = 'assessmatrix-updates';

/** Every push the backend sends carries the event type, which is also the tap destination. */
function targetRoute(data: Record<string, unknown> | undefined): Href | null {
  if (data?.type === 'mark') return '/student/results';
  if (data?.type === 'assessment') return '/student';
  return null;
}

/**
 * A push that never registers is invisible: the app keeps working, it just stays quiet. Each
 * early return names itself here so a broken setup shows up in the console instead of vanishing.
 */
function report(stage: string, error?: unknown): void {
  const reason = error instanceof Error ? error.message : (error ?? '');
  console.warn(`[push] ${stage}${reason ? `: ${reason}` : ''}`);
}

async function registerForPush(): Promise<void> {
  // Without the EAS project id there are no push credentials: Expo Go, and any unbuilt run.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (projectId === undefined) {
    report('no EAS project id — build with eas build --profile development, Expo Go has no push');
    return;
  }

  if ((await getPermissionsAsync()).status !== 'granted') {
    if ((await requestPermissionsAsync()).status !== 'granted') {
      report('notification permission was refused');
      return;
    }
  }

  // The config plugin points Android messages at this channel; it still has to be created.
  await setNotificationChannelAsync(CHANNEL, {
    name: 'Assessment updates',
    importance: AndroidImportance.HIGH,
  }).catch(() => undefined);

  const token = await getExpoPushTokenAsync({ projectId });
  await notificationsApi.register(token.data);
}

/**
 * Mounts the foreground display rules and registers the signed-in account's push token.
 *
 * A failed registration is silent on purpose: the app works either way, it just stays quiet.
 * Clearing the token belongs to `signOut`, which still has credentials to authenticate the call.
 */
export function PushNotifications({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();

  useEffect(() => {
    if (!IS_PUSH_CAPABLE) return;

    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const subscription = addNotificationResponseReceivedListener((response) => {
      const target = targetRoute(response.notification.request.content.data);
      if (target !== null) router.push(target);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!IS_PUSH_CAPABLE) {
      report('this platform has no push — expo-notifications tokens are native-only');
      return;
    }
    if (status !== 'signed-in') return;
    registerForPush().catch((error) => report('token registration failed', error));
  }, [status, user?.id]);

  return <>{children}</>;
}
