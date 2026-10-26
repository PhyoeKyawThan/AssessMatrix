import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Server rendering cannot see the stored theme or a real viewport, so it always emits the light
 * palette at the compact breakpoint. The client has to reproduce that exact tree on its first
 * pass or React reports a hydration mismatch; the real values land in the commit right after.
 * Native has no server pass, so it starts ready.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(Platform.OS !== 'web');

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
