import { Pressable, StyleSheet, View } from 'react-native';

import { useHydrated } from '@/shared/theme/hydration';
import { useLayoutOverride, useResponsive, useTheme, type Breakpoint } from '@/shared/theme';
import { Meta } from '@/shared/ui/text';

const OPTIONS: { value: Breakpoint | null; label: string }[] = [
  { value: null, label: 'Auto' },
  { value: 'compact', label: 'Phone' },
  { value: 'medium', label: 'Tablet' },
  { value: 'wide', label: 'Desktop' },
];

/**
 * Development affordance for checking the phone, tablet and desktop layout of a screen without a
 * device wall. `Auto` follows the real window width.
 */
export function LayoutPreviewBar() {
  const { colors } = useTheme();
  const layout = useResponsive();
  const hydrated = useHydrated();
  const { override, setOverride } = useLayoutOverride();

  // Web server rendering cannot see a viewport, so the bar appears one commit later.
  if (!hydrated) return null;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View
        accessibilityRole="group"
        accessibilityLabel="Preview layout width"
        style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Meta tone="faint">{layout.breakpoint.toUpperCase()}</Meta>
        {OPTIONS.map((option) => {
          const selected = option.value === override;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setOverride(option.value)}
              style={[
                styles.pill,
                { borderColor: selected ? colors.primary : colors.border },
                selected && { backgroundColor: colors.primary },
              ]}
            >
              <Meta tone={selected ? 'onPrimary' : 'muted'}>{option.label}</Meta>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 0, bottom: 0, left: 0, alignItems: 'center', paddingBottom: 8 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
});
