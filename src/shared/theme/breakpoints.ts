import { useWindowDimensions } from 'react-native';

import { layoutFor, type Layout } from '@/shared/theme/layout';
import { PREVIEW_WIDTH, useLayoutOverride } from '@/shared/theme/layout-override';
import { useHydrated } from '@/shared/theme/hydration';

export { layoutFor, scale, type Breakpoint, type Layout } from '@/shared/theme/layout';

export function useResponsive(): Layout {
  const hydrated = useHydrated();
  const { override } = useLayoutOverride();
  const { width } = useWindowDimensions();

  // Pre-hydration the tree has to match the compact markup the server emitted.
  if (!hydrated) return layoutFor(0);
  return layoutFor(override === null ? width : PREVIEW_WIDTH[override]);
}
