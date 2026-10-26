import { Link, Stack } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { scale, useResponsive, useTheme } from '@/shared/theme';
import { Screen } from '@/shared/ui/screen';

export default function NotFound() {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen style={styles.center}>
        <Text
          style={{
            color: colors.text,
            fontSize: scale(20, layout.typeScale),
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          This screen does not exist.
        </Text>
        <Link href="/" style={{ color: colors.link, textAlign: 'center', fontSize: scale(15, layout.typeScale) }}>
          Back to the app
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
