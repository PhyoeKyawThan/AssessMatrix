import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import type { Role } from '@/features/auth/types';
import { notificationsApi } from '@/features/notifications/api';

/** Web push needs a service worker and VAPID keys, so registration stays on Android and iOS. */
const IS_PUSH_CAPABLE = Platform.OS !== 'web';

const CHANNEL = 'assessmatrix-updates';
const PUSH_PREFERENCE_KEY = 'assessmatrix.push-enabled';

/** Every push the backend sends carries the event type, which is also the tap destination. */
function targetRoute(data: Record<string, unknown> | undefined, role?: Role): Href | null {
  if (data?.type === 'notification' && role) return `/${role.toLowerCase()}/notifications` as Href;
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

export async function getPushPreference(): Promise<boolean> {
  return (await AsyncStorage.getItem(PUSH_PREFERENCE_KEY)) === 'true';
}

export async function registerForPush(): Promise<boolean> {
  // Without the EAS project id there are no push credentials: Expo Go, and any unbuilt run.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (projectId === undefined) {
    report('no EAS project id — build with eas build --profile development, Expo Go has no push');
    return false;
  }

  // Android 13 does not show its notification permission prompt until a channel exists.
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(CHANNEL, {
      name: 'Assessment updates',
      importance: AndroidImportance.HIGH,
    });
  }

  if ((await getPermissionsAsync()).status !== 'granted') {
    if ((await requestPermissionsAsync()).status !== 'granted') {
      report('notification permission was refused');
      return false;
    }
  }

  const token = await getExpoPushTokenAsync({ projectId });
  await notificationsApi.register(token.data);
  return true;
}

export async function setPushEnabled(enabled: boolean): Promise<boolean> {
  await AsyncStorage.setItem(PUSH_PREFERENCE_KEY, enabled ? 'true' : 'false');
  if (!enabled) {
    await notificationsApi.clear();
    return false;
  }
  if (!IS_PUSH_CAPABLE) return false;
  try {
    const registered = await registerForPush();
    if (!registered) await AsyncStorage.setItem(PUSH_PREFERENCE_KEY, 'false');
    return registered;
  } catch (error) {
    await AsyncStorage.setItem(PUSH_PREFERENCE_KEY, 'false');
    throw error;
  }
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
      const target = targetRoute(response.notification.request.content.data, user?.role);
      if (target !== null) router.push(target);
    });

    return () => {
      subscription.remove();
    };
  }, [user?.role]);

  useEffect(() => {
    // Web push is intentionally unsupported, so this is an expected no-op rather than a warning.
    if (!IS_PUSH_CAPABLE) return;
    if (status !== 'signed-in') return;
    getPushPreference()
      .then((enabled) => enabled ? registerForPush() : false)
      .catch((error) => report('token registration failed', error));
  }, [status, user?.id]);

  return <>{children}</>;
}
