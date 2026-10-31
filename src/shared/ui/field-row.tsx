import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/shared/theme';

/** Fields sit side by side once there is room; a single column keeps phones readable. */
export function FieldRow({ children }: { children: ReactNode }) {
  const layout = useResponsive();
  const row = layout.detailColumns === 2;
  const items = Children.toArray(children);

  return (
    <View
      style={
        row
          ? [styles.row, { gap: layout.gap }]
          : { flexDirection: 'column', gap: layout.gap }
      }
    >
      {items.map((child, index) =>
        row ? (
          <View key={index} style={styles.cell}>
            {child}
          </View>
        ) : (
          child
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', width: '100%' },
  cell: { flexGrow: 1, flexShrink: 1, flexBasis: '45%', minWidth: 220, maxWidth: '100%' },
});
