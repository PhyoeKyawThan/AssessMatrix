import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, useResponsive, useTheme } from '@/shared/theme';
import { Icon } from '@/shared/ui/icon';
import { Body, Value } from '@/shared/ui/text';

interface RecordRowProps {
  title: string;
  subtitle?: string | null;
  badge?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function RecordRow({ title, subtitle, badge, trailing, onPress, style }: RecordRowProps) {
  const { colors } = useTheme();
  const layout = useResponsive();

  const inner = (
    <View style={[styles.row, { paddingVertical: layout.gap - 6, gap: 4 }, style]}>
      <View style={styles.main}>
        <Value lines={2}>{title}</Value>
        {subtitle !== undefined && subtitle !== null ? <Body tone="muted" lines={2}>{subtitle}</Body> : null}
      </View>
      {badge !== undefined || trailing !== undefined ? (
        <View style={[styles.side, { gap: layout.gap - 8 }]}>
          {badge}
          {trailing}
        </View>
      ) : null}
      {onPress !== undefined ? <Icon name="chevron" size={16} color={colors.textFaint} /> : null}
    </View>
  );

  if (onPress === undefined) {
    return (
      <View style={[styles.plain, { borderColor: colors.border, backgroundColor: colors.surfaceAlt, borderRadius: radius.input }]}>{inner}</View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.plain,
        { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface, borderRadius: radius.input },
        pressed && styles.pressed,
      ]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plain: { borderWidth: 1, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  main: { flex: 1, minWidth: 0 },
  side: { alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' },
  pressed: { opacity: 0.9 },
});
