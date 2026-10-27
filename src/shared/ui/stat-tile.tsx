import { StyleSheet, Text, View } from 'react-native';

import { scale, toneSet, useResponsive, useTheme, type Tone } from '@/shared/theme';
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
          backgroundColor: set.background,
          borderColor: set.border,
          borderRadius: 14,
          gap: 2,
          padding: layout.gap - 4,
        },
      ]}
    >
      <View style={styles.head}>
        <Text
          numberOfLines={2}
          style={{
            color: set.text,
            flex: 1,
            fontSize: scale(12, layout.typeScale),
            fontWeight: '700',
            letterSpacing: 0.3,
          }}
        >
          {label.toUpperCase()}
        </Text>
        {icon !== undefined ? <Icon name={icon} size={18} color={set.text} /> : null}
      </View>
      <Text
        accessibilityRole="text"
        numberOfLines={1}
        style={{
          color: set.text,
          fontSize: scale(layout.breakpoint === 'compact' ? 22 : 26, layout.typeScale),
          fontWeight: '800',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  // Four tiles fit a desktop row and two fit a phone; `minWidth` keeps the second case honest.
  tile: { flexGrow: 1, flexBasis: '23%', minWidth: 150 },
});
