import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useResponsive, useTheme } from '@/shared/theme';

interface ScreenProps extends ViewProps {
  scroll?: boolean;
  /** 'form' keeps text columns readable on wide screens; 'content' uses the whole column. */
  width?: 'form' | 'content';
}

export function Screen({ children, scroll = false, width = 'content', style, ...rest }: ScreenProps) {
  const { colors } = useTheme();
  const layout = useResponsive();

  const inner = (
    <View
      style={[
        styles.content,
        {
          gap: layout.gap,
          padding: layout.gutter,
          maxWidth: width === 'form' ? layout.formMaxWidth : layout.contentMaxWidth,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={Platform.OS !== 'web'}
        style={styles.keyboard}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrolling}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
          >
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, width: '100%', alignSelf: 'center' },
  scrolling: { flexGrow: 1 },
});
