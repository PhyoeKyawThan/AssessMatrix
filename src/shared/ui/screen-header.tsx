import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { scale, useResponsive, useTheme } from '@/shared/theme';
import { Body, Title } from '@/shared/ui/text';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string | null;
  /** Renders a back affordance; screens reached from a tab-style hub can omit it. */
  back?: boolean;
  actions?: ReactNode;
}

export function ScreenHeader({ title, subtitle, back = false, actions }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <View style={[styles.header, { gap: layout.gap - 8 }]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={10}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={[styles.back, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <View style={[styles.chevron, { borderColor: colors.textSecondary }]} />
            </Pressable>
          ) : null}
          <Title>{title}</Title>
        </View>
        {actions !== undefined ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      {subtitle !== undefined && subtitle !== null ? <Body tone="muted">{subtitle}</Body> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  titleBlock: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  back: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: scale(10, 1),
    height: scale(10, 1),
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginLeft: 3,
  },
});
