import { Pressable, StyleSheet, Text, View } from 'react-native';

import { scale, useResponsive, useTheme, type ThemePreference } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/icon';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const ICONS: Record<ThemePreference, IconName> = { system: 'monitor', light: 'sun', dark: 'moon' };

interface ThemeToggleProps {
  /** `onDark` is the icon-only control used inside the sidebar and desktop rail. */
  variant?: 'header' | 'onDark';
}

export function ThemeToggle({ variant = 'header' }: ThemeToggleProps) {
  const { colors, preference, setPreference } = useTheme();
  const layout = useResponsive();
  const compact = variant === 'header' && layout.breakpoint === 'compact';
  const onDark = variant === 'onDark';

  const surface = onDark
    ? { backgroundColor: colors.sidebarActiveBackground, borderColor: colors.sidebarBorder }
    : { backgroundColor: colors.surface, borderColor: colors.border };

  if (onDark) {
    const index = OPTIONS.findIndex((option) => option.value === preference);
    const next = OPTIONS[(index + 1) % OPTIONS.length];
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${OPTIONS[index].label} theme. Change to ${next.label}.`}
        onPress={() => setPreference(next.value)}
        style={({ pressed }) => [styles.iconToggle, surface, pressed && { opacity: 0.7 }]}
      >
        <Icon name={ICONS[preference]} size={18} color={colors.sidebarText} />
      </Pressable>
    );
  }

  return (
    <View
      role="group"
      accessibilityLabel="Colour theme"
      style={[styles.row, compact ? styles.compact : styles.expanded, surface]}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === preference;
        const tint = { active: colors.onPrimary, idle: colors.textMuted, fill: colors.primary };

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
              selected && { backgroundColor: tint.fill },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  fontSize: scale(13, layout.typeScale),
                  color: selected ? tint.active : tint.idle,
                },
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
  iconToggle: { alignItems: 'center', borderRadius: 999, borderWidth: 1, height: 34, justifyContent: 'center', width: 34 },
  label: { fontWeight: '700' },
});
