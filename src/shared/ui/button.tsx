import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { radius, scale, useResponsive, useTheme } from '@/shared/theme';
import { Icon, type IconName } from '@/shared/ui/icon';
import { AnimatedLoader } from '@/shared/ui/animated-loader';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  icon?: IconName;
}

export function Button({ label, loading = false, variant = 'primary', icon, disabled, ...rest }: ButtonProps) {
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
        {
          minHeight: layout.breakpoint === 'compact' ? 44 : 46,
          paddingHorizontal: layout.gap - 2,
          borderRadius: radius.input,
        },
        secondary
          ? { backgroundColor: colors.surface, borderColor: colors.border }
          : { backgroundColor: colors.primary, borderColor: colors.primary },
        pressed && !inactive && styles.pressed,
        inactive && styles.dimmed,
      ]}
      {...rest}
    >
      {loading ? (
        <AnimatedLoader size={19} color={secondary ? colors.text : colors.onPrimary} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={17} color={secondary ? colors.textSecondary : colors.onPrimary} /> : null}
          <Text
            style={[
              styles.label,
              { fontSize: scale(14, layout.typeScale) },
              { color: secondary ? colors.text : colors.onPrimary },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700', letterSpacing: 0.1, flexShrink: 1, textAlign: 'center' },
  pressed: { opacity: 0.78 },
  dimmed: { opacity: 0.5 },
});
