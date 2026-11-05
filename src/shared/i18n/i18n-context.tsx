import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { translations } from './translations';

export type LanguagePreference = 'system' | 'en' | 'my';
type Language = 'en' | 'my';
type TranslateOptions = Record<string, string | number>;

const STORAGE_KEY = 'assessmatrix.language';
interface I18nContextValue {
  language: Language;
  preference: LanguagePreference;
  setPreference(value: LanguagePreference): Promise<void>;
  t(key: string, options?: TranslateOptions): string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function deviceLanguage(): Language {
  return getLocales()[0]?.languageCode === 'my' ? 'my' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [preference, setStoredPreference] = useState<LanguagePreference>('system');
  const language = preference === 'system' ? deviceLanguage() : preference;
  const engine = useMemo(() => {
    const next = new I18n(translations);
    next.enableFallback = true;
    next.defaultLocale = 'en';
    next.locale = language;
    return next;
  }, [language]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'system' || saved === 'en' || saved === 'my') setStoredPreference(saved);
    }).catch(() => undefined);
  }, []);

  const setPreference = useCallback(async (value: LanguagePreference) => {
    setStoredPreference(value);
    await AsyncStorage.setItem(STORAGE_KEY, value);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      preference,
      setPreference,
      t: (key, options) => engine.t(key, options),
    };
  }, [engine, language, preference, setPreference]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === null) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
