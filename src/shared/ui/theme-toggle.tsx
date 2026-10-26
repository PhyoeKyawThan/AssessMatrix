import { Pressable, StyleSheet, Text, View } from 'react-native';

import { scale, useResponsive, useTheme, type ThemePreference } from '@/shared/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeToggle() {
  const { colors, preference, setPreference } = useTheme();
  const layout = useResponsive();
  const compact = layout.breakpoint === 'compact';

  return (
    <View
      accessibilityRole="group"
      accessibilityLabel="Colour theme"
      style={[
        styles.row,
        compact ? styles.compact : styles.expanded,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === preference;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label} theme`}
            onPress={() => setPreference(option.value)}
            style={[
              styles.segment,
              compact ? styles.segmentCompact : styles.segmentWide,
              selected && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.label,
                { fontSize: scale(13, layout.typeScale), color: selected ? colors.onPrimary : colors.textMuted },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignSelf: 'flex-end', borderRadius: 999, borderWidth: 1 },
  compact: { padding: 3, gap: 3 },
  expanded: { padding: 4, gap: 4 },
  segment: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segmentCompact: { paddingHorizontal: 10, minHeight: 32, justifyContent: 'center' },
  segmentWide: { paddingHorizontal: 14, minHeight: 36 },
  label: { fontWeight: '600' },
});
