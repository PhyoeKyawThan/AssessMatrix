import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, scale, useResponsive, useTheme } from '@/shared/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string | null;
  back?: boolean;
  actions?: ReactNode;
}

export function AppHeader({ title, subtitle, back = false, actions }: AppHeaderProps) {
  const { colors } = useTheme();
  const layout = useResponsive();
  const router = useRouter();
  // A phone-width row cannot hold the title and screen actions, so actions get their own line.
  const stackedActions = layout.breakpoint === 'compact' && actions !== undefined && actions !== null;

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border, gap: layout.gap - 8, paddingBottom: layout.gap - 4 }]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={10}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={({ pressed }) => [
                styles.back,
                { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 22, lineHeight: 24, fontWeight: '700' }}>‹</Text>
            </Pressable>
          ) : null}
          <Text
            style={{
              color: colors.text,
              fontWeight: '700',
              fontSize: scale(layout.breakpoint === 'compact' ? 22 : 25, layout.typeScale),
              letterSpacing: -0.35,
              flexShrink: 1,
            }}
          >
            {title}
          </Text>
        </View>
        <View style={[styles.actions, stackedActions && styles.stackedActions]}>
          {actions}
        </View>
      </View>
      {subtitle !== undefined && subtitle !== null ? (
        <Text style={{ color: colors.textMuted, fontSize: scale(14, layout.typeScale) }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: StyleSheet.hairlineWidth },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  titleBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  stackedActions: { width: '100%', justifyContent: 'flex-end' },
  back: {
    width: 34,
    height: 34,
    borderRadius: radius.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
