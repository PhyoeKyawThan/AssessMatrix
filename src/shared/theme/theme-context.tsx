import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { applyDocumentTheme } from '@/shared/theme/document-style';
import { useHydrated } from '@/shared/theme/hydration';
import { darkPalette, lightPalette, type ColorScheme, type Palette } from '@/shared/theme/palette';

export type ThemePreference = 'system' | ColorScheme;

interface ThemeValue {
  colors: Palette;
  scheme: ColorScheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const PREFERENCE_KEY = 'assessmatrix.theme-preference';
const ThemeContext = createContext<ThemeValue | null>(null);

function isPreference(stored: string | null): stored is ThemePreference {
  return stored === 'system' || stored === 'light' || stored === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const hydrated = useHydrated();
  const [preference, setStoredPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(PREFERENCE_KEY).then((stored) => {
      if (isPreference(stored)) setStoredPreference(stored);
    });
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setStoredPreference(next);
    AsyncStorage.setItem(PREFERENCE_KEY, next).catch(() => undefined);
  }, []);

  const scheme: ColorScheme = hydrated ? (preference === 'system' ? systemScheme : preference) : 'light';
  const colors = scheme === 'dark' ? darkPalette : lightPalette;

  useEffect(() => {
    applyDocumentTheme(scheme, colors.background);
  }, [scheme, colors.background]);

  const value = useMemo(
    () => ({ colors, scheme, preference, setPreference }),
    [colors, scheme, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (value === null) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
