import { Pressable, StyleSheet, View } from 'react-native';

import { useResponsive, useTheme } from '@/shared/theme';
import { Body, Value } from '@/shared/ui/text';

interface CheckRowProps {
  title: string;
  subtitle?: string | null;
  checked: boolean;
  onToggle: () => void;
}

export function CheckRow({ title, subtitle, checked, onToggle }: CheckRowProps) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={[
        styles.row,
        {
          minHeight: layout.breakpoint === 'compact' ? 48 : 52,
          paddingHorizontal: layout.gap - 6,
          paddingVertical: 8,
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.surfaceAlt : colors.surface,
        },
      ]}
    >
      <View
        style={[
          styles.box,
          { borderColor: checked ? colors.primary : colors.inputBorder, backgroundColor: checked ? colors.primary : colors.inputBackground },
        ]}
      >
        {checked ? <View style={styles.tick} /> : null}
      </View>
      <View style={styles.text}>
        <Value lines={1}>{title}</Value>
        {subtitle !== undefined && subtitle !== null ? <Body tone="muted" lines={1}>{subtitle}</Body> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, width: '100%' },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 10, height: 5, borderWidth: 2, borderTopWidth: 0, borderRightWidth: 0, transform: [{ rotate: '-45deg' }], marginBottom: 2 },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
