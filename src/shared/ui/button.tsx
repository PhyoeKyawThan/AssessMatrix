import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { scale, useResponsive, useTheme } from '@/shared/theme';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, loading = false, variant = 'primary', disabled, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const layout = useResponsive();
  const inactive = disabled || loading;
  const secondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        { minHeight: layout.breakpoint === 'compact' ? 48 : 52, paddingHorizontal: layout.gap },
        secondary
          ? { backgroundColor: colors.surface, borderColor: colors.border }
          : { backgroundColor: colors.primary },
        pressed && !inactive && styles.pressed,
        inactive && styles.dimmed,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.text : colors.onPrimary} />
      ) : (
        <Text
          style={[
            styles.label,
            { fontSize: scale(16, layout.typeScale) },
            { color: secondary ? colors.text : colors.onPrimary },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '600' },
  pressed: { opacity: 0.85 },
  dimmed: { opacity: 0.5 },
});
