import { useWindowDimensions } from 'react-native';

import { layoutFor, type Layout } from '@/shared/theme/layout';
import { useHydrated } from '@/shared/theme/hydration';

export { layoutFor, scale, type Breakpoint, type Layout } from '@/shared/theme/layout';

export function useResponsive(): Layout {
  const hydrated = useHydrated();
  const { width } = useWindowDimensions();

  // Pre-hydration the tree has to match the compact markup the server emitted.
  return layoutFor(hydrated ? width : 0);
}
