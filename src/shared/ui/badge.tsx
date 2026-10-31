import { StyleSheet, Text, View } from 'react-native';

import { scale, useResponsive, useTheme } from '@/shared/theme';
import type { Tone } from '@/shared/theme';

export type BadgeTone = 'accent' | 'danger' | 'info' | 'neutral' | 'success' | 'warning';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const TONE_KEYS: Record<BadgeTone, Tone> = {
  accent: 'accent',
  danger: 'danger',
  info: 'primary',
  neutral: 'neutral',
  success: 'success',
  warning: 'warning',
};

export function Badge({ label, tone = 'info' }: BadgeProps) {
  const { colors } = useTheme();
  const layout = useResponsive();
  const set = colors.tones[TONE_KEYS[tone]];

  return (
    <View style={[styles.badge, { backgroundColor: set.background, borderColor: set.border }]}>
      <Text style={[styles.text, { color: set.text, fontSize: scale(12, layout.typeScale) }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: { fontWeight: '700', letterSpacing: 0.45 },
});
