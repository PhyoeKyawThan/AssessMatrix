import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { clearTokens, loadTokens, saveTokens } from '@/shared/storage/token-storage';
import { ApiError } from '@/shared/api/types';
import { fetchCurrentUser, logoutRequest, signInRequest } from '@/features/auth/api';
import type { SessionUser } from '@/features/auth/types';

type AuthStatus = 'restoring' | 'signed-out' | 'signed-in';

interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  signIn(email: string, password: string): Promise<SessionUser>;
  signOut(): Promise<void>;
  /** Re-reads GET /api/me/ so the caller can show the session is still valid. */
  refreshUser(): Promise<SessionUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if ((await loadTokens()) === null) {
        if (!cancelled) setStatus('signed-out');
        return;
      }
      try {
        const restored = await fetchCurrentUser();
        if (!cancelled) {
          setUser(restored);
          setStatus('signed-in');
        }
      } catch {
        await clearTokens();
        if (!cancelled) setStatus('signed-out');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const tokens = await signInRequest(email, password);
    await saveTokens(tokens);
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
      setStatus('signed-in');
      return profile;
    } catch (error) {
      await clearTokens();
      setUser(null);
      setStatus('signed-out');
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const tokens = await loadTokens();
    if (tokens !== null) {
      // A failed blacklist call must not leave the caller stuck in a signed-in state.
      await logoutRequest(tokens.refresh).catch(() => undefined);
    }
    await clearTokens();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
      return profile;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) await signOut();
      throw error;
    }
  }, [signOut]);

  const value = useMemo(
    () => ({ status, user, signIn, signOut, refreshUser }),
    [status, user, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
