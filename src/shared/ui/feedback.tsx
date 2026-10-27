import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useResponsive, useTheme } from '@/shared/theme';
import { Body } from '@/shared/ui/text';

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <View style={[styles.block, { gap: layout.gap - 6 }]} accessibilityRole="status" accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.spinner} />
      <Body tone="muted">{label}</Body>
    </View>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <View
      style={[
        styles.block,
        {
          gap: layout.gap - 4,
          padding: layout.gap,
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.border,
          backgroundColor: colors.surfaceAlt,
        },
      ]}
    >
      <Body tone="muted">{message}</Body>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, width: '100%' },
});
