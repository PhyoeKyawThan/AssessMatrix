import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useResponsive, useTheme } from '@/shared/theme';
import { Body } from '@/shared/ui/text';
import { Card } from '@/shared/ui/card';
import { RecordRow } from '@/shared/ui/record-row';

export interface PanelItem {
  key: string;
  title: string;
  subtitle?: string | null;
  badge?: ReactNode;
  onPress?: () => void;
}

interface ListPanelProps {
  title: string;
  items: PanelItem[];
  /** Shown when the role has no rows yet — an empty panel looks like a broken one. */
  fallback: string;
  footnote?: ReactNode;
}

export function ListPanel({ title, items, fallback, footnote }: ListPanelProps) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <Card title={title} style={[styles.panel, { borderColor: colors.border, minWidth: 280 }]}>
      <View style={{ gap: layout.gap - 8 }}>
        {items.length === 0 ? <Body tone="muted">{fallback}</Body> : null}
        {items.map((item) => (
          <RecordRow
            key={item.key}
            title={item.title}
            subtitle={item.subtitle}
            badge={item.badge}
            onPress={item.onPress}
          />
        ))}
        {footnote}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  panel: { flexGrow: 1, flexBasis: '45%' },
});
