import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useResponsive, useTheme } from '@/shared/theme';
import { SectionTitle } from '@/shared/ui/text';

interface CardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ title, actions, children, style }: CardProps) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, padding: layout.gap, gap: layout.gap - 4 },
        style,
      ]}
    >
      {title !== undefined || actions !== undefined ? (
        <View style={[styles.header, { gap: layout.gap - 8 }]}>
          {title !== undefined ? <SectionTitle>{title}</SectionTitle> : null}
          {actions !== undefined ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, width: '100%' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
});
