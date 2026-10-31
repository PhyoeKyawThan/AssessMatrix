import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, scale, useResponsive, useTheme } from '@/shared/theme';

export interface Option<T extends string> {
  value: T;
  label: string;
}

interface OptionChipsProps<T extends string> {
  label?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function OptionChips<T extends string>({ label, options, value, onChange }: OptionChipsProps<T>) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <View style={{ gap: layout.breakpoint === 'compact' ? 6 : 8 }}>
      {label !== undefined ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontWeight: '500',
            fontSize: scale(14, layout.typeScale),
          }}
        >
          {label}
        </Text>
      ) : null}
      <View style={styles.row} role="group" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              role="group"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  minHeight: layout.breakpoint === 'compact' ? 44 : 46,
                  paddingHorizontal: layout.gap - 4,
                  borderColor: selected ? colors.primary : colors.inputBorder,
                  backgroundColor: selected ? colors.tones.primary.background : colors.inputBackground,
                  borderRadius: radius.input,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipLabel,
                  {
                    color: selected ? colors.tones.primary.text : colors.textSecondary,
                    fontWeight: '600',
                    fontSize: scale(14, layout.typeScale),
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 1, maxWidth: '100%' },
  chipLabel: { flexShrink: 1, textAlign: 'center' },
});
