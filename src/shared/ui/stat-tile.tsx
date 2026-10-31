import { StyleSheet, Text, View } from 'react-native';

import { elevation, radius, scale, toneSet, useResponsive, useTheme, type Tone } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/icon';

interface StatTileProps {
  label: string;
  value: string;
  tone: Tone;
  icon?: IconName;
}

/** One number from the dashboard payload, tinted by its server-supplied tone. */
export function StatTile({ label, value, tone, icon }: StatTileProps) {
  const { colors } = useTheme();
  const layout = useResponsive();
  const set = toneSet(colors, tone);

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.tile,
          gap: 8,
          padding: layout.gap - 2,
          ...elevation(colors),
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: set.bar }]} />
      <View style={styles.head}>
        <Text
          numberOfLines={2}
          style={{
            color: colors.textMuted,
            flex: 1,
            fontSize: scale(11, layout.typeScale),
            fontWeight: '700',
            letterSpacing: 0.7,
          }}
        >
          {label.toUpperCase()}
        </Text>
        {icon !== undefined ? (
          <View style={[styles.icon, { backgroundColor: set.background, borderColor: set.border }]}>
            <Icon name={icon} size={17} color={set.text} />
          </View>
        ) : null}
      </View>
      <Text
        accessibilityRole="text"
        numberOfLines={1}
        style={{
          color: colors.text,
          fontSize: scale(layout.breakpoint === 'compact' ? 24 : 28, layout.typeScale),
          fontWeight: '700',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  accent: { borderRadius: 2, height: 3, left: 16, position: 'absolute', top: 0, width: 32 },
  icon: { alignItems: 'center', borderRadius: 7, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 },
  // Four tiles fit a desktop row and two fit a phone; `minWidth` keeps the second case honest.
  tile: { flexGrow: 1, flexBasis: '23%', minWidth: 150 },
});
