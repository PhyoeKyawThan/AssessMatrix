import { StyleSheet, Text, View } from 'react-native';

import { scale, useResponsive, useTheme } from '@/shared/theme';

interface ErrorBannerProps {
  title: string;
  messages: string[];
}

export function ErrorBanner({ title, messages }: ErrorBannerProps) {
  const { colors } = useTheme();
  const layout = useResponsive();

  if (title === '' && messages.length === 0) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: colors.dangerBackground, padding: layout.gap - 2 }]}
    >
      {title !== '' ? (
        <Text style={[styles.title, { color: colors.dangerTitle, fontSize: scale(14, layout.typeScale) }]}>
          {title}
        </Text>
      ) : null}
      {messages.map((message, index) => (
        <Text key={`${message}-${index}`} style={{ color: colors.dangerText, fontSize: scale(14, layout.typeScale) }}>
          {message}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 10, gap: 4 },
  title: { fontWeight: '700' },
});
