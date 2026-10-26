import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { TokenPair } from '@/shared/api/types';

const ACCESS_KEY = 'assessmatrix.access';
const REFRESH_KEY = 'assessmatrix.refresh';

// SecureStore has no web implementation, so the web preview falls back to localStorage.
const store = Platform.OS === 'web'
  ? {
      getItem: async (key: string): Promise<string | null> =>
        globalThis.localStorage?.getItem(key) ?? null,
      setItem: async (key: string, value: string): Promise<void> => {
        globalThis.localStorage?.setItem(key, value);
      },
      removeItem: async (key: string): Promise<void> => {
        globalThis.localStorage?.removeItem(key);
      },
    }
  : {
      getItem: (key: string): Promise<string | null> => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value),
      removeItem: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
    };

export async function saveTokens(tokens: TokenPair): Promise<void> {
  await Promise.all([store.setItem(ACCESS_KEY, tokens.access), store.setItem(REFRESH_KEY, tokens.refresh)]);
}

export async function loadTokens(): Promise<TokenPair | null> {
  const [access, refresh] = await Promise.all([store.getItem(ACCESS_KEY), store.getItem(REFRESH_KEY)]);
  if (!access || !refresh) return null;
  return { access, refresh };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([store.removeItem(ACCESS_KEY), store.removeItem(REFRESH_KEY)]);
}
