import { StyleSheet, Text, View } from 'react-native';

import { scale, useResponsive, useTheme } from '@/shared/theme';

export function Badge({ label }: { label: string }) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <View style={[styles.badge, { borderColor: colors.primary }]}>
      <Text style={[styles.text, { color: colors.link, fontSize: scale(13, layout.typeScale) }]}>
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
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: { fontWeight: '700', letterSpacing: 0.6 },
});
