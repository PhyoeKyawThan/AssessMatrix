import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { scale, useResponsive, useTheme } from '@/shared/theme';
import { AnimatedLoader } from '@/shared/ui/animated-loader';

export function SessionLoader({ label = 'Loading…' }: { label?: string }) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <SafeAreaView style={[styles.wrapper, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        style={[styles.inner, { gap: layout.gap - 4 }]}
      >
        <AnimatedLoader size={46} color={colors.spinner} />
        <Text style={{ color: colors.textMuted, fontSize: scale(14, layout.typeScale) }}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
