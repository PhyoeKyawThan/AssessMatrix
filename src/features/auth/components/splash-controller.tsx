import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
  SplashScreen.setOptions({ duration: 450, fade: true });
}

/** Native splash covers session restoration; web falls back to SessionLoader. */
export function SplashController() {
  const { status } = useAuth();

  useEffect(() => {
    if (Platform.OS !== 'web' && status !== 'restoring') SplashScreen.hide();
  }, [status]);

  return null;
}
