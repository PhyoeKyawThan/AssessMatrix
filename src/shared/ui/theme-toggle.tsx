import { Pressable, StyleSheet, Text, View } from 'react-native';

import { scale, useResponsive, useTheme, type ThemePreference } from '@/shared/theme';

const OPTIONS: { value: ThemePreference; label: string; short: string }[] = [
  { value: 'system', label: 'System', short: 'A' },
  { value: 'light', label: 'Light', short: 'L' },
  { value: 'dark', label: 'Dark', short: 'D' },
];

interface ThemeToggleProps {
  /** `onDark` is the single-letter form used inside the sidebar, rail and tab bar. */
  variant?: 'header' | 'onDark';
}

export function ThemeToggle({ variant = 'header' }: ThemeToggleProps) {
  const { colors, preference, setPreference } = useTheme();
  const layout = useResponsive();
  const compact = variant === 'header' && layout.breakpoint === 'compact';
  const onDark = variant === 'onDark';

  const surface = onDark
    ? { backgroundColor: colors.brandDeep, borderColor: colors.sidebarBorder }
    : { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <View
      accessibilityRole="group"
      accessibilityLabel="Colour theme"
      style={[styles.row, compact ? styles.compact : styles.expanded, onDark && styles.rowDark, surface]}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === preference;
        const tint = onDark
          ? { active: colors.sidebarActive, idle: colors.sidebarText, fill: colors.sidebarActiveBackground }
          : { active: colors.onPrimary, idle: colors.textMuted, fill: colors.primary };

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label} theme`}
            onPress={() => setPreference(option.value)}
            style={[
              styles.segment,
              onDark ? styles.segmentMini : compact ? styles.segmentCompact : styles.segmentWide,
              selected && { backgroundColor: tint.fill },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  fontSize: scale(onDark ? 12 : 13, layout.typeScale),
                  color: selected ? tint.active : tint.idle,
                },
              ]}
            >
              {onDark ? option.short : option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignSelf: 'flex-end', borderRadius: 999, borderWidth: 1 },
  rowDark: { alignSelf: 'auto' },
  compact: { padding: 3, gap: 3 },
  expanded: { padding: 4, gap: 4 },
  segment: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segmentCompact: { paddingHorizontal: 10, minHeight: 32, justifyContent: 'center' },
  segmentWide: { paddingHorizontal: 14, minHeight: 36 },
  segmentMini: { height: 24, justifyContent: 'center', width: 24 },
  label: { fontWeight: '700' },
});
