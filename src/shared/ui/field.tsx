import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { scale, useResponsive, useTheme } from '@/shared/theme';

interface FieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

export function Field({ label, error, ...rest }: FieldProps) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <View style={{ gap: layout.breakpoint === 'compact' ? 6 : 8 }}>
      <Text style={[styles.label, { color: colors.textSecondary, fontSize: scale(14, layout.typeScale) }]}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            minHeight: layout.breakpoint === 'compact' ? 48 : 52,
            paddingHorizontal: layout.gap - 4,
            fontSize: scale(16, layout.typeScale),
            color: colors.text,
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.errorBorder : colors.inputBorder,
          },
        ]}
        placeholderTextColor={colors.placeholder}
        {...rest}
      />
      {error ? (
        <Text style={{ color: colors.errorText, fontSize: scale(13, layout.typeScale) }}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '500' },
  input: {
    borderRadius: 10,
    borderWidth: 1,
  },
});
