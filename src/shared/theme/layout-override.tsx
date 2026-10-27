import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Breakpoint } from '@/shared/theme/layout';

/** Representative widths for each breakpoint, used when the layout is forced. */
export const PREVIEW_WIDTH: Record<Breakpoint, number> = {
  compact: 390,
  medium: 820,
  wide: 1440,
};

interface LayoutOverrideValue {
  override: Breakpoint | null;
  setOverride: (breakpoint: Breakpoint | null) => void;
}

const LayoutOverrideContext = createContext<LayoutOverrideValue>({
  override: null,
  setOverride: () => undefined,
});

/**
 * Without a provider the app follows the real window size. The dev preview bar mounts one so a
 * phone, tablet and desktop layout can be checked on a single screen.
 */
export function LayoutOverrideProvider({ children }: { children: ReactNode }) {
  const [override, setStored] = useState<Breakpoint | null>(null);
  const setOverride = useCallback((breakpoint: Breakpoint | null) => setStored(breakpoint), []);
  const value = useMemo(() => ({ override, setOverride }), [override, setOverride]);

  return <LayoutOverrideContext.Provider value={value}>{children}</LayoutOverrideContext.Provider>;
}

export function useLayoutOverride(): LayoutOverrideValue {
  return useContext(LayoutOverrideContext);
}
