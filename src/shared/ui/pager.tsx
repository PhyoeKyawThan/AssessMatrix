import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import { Body } from '@/shared/ui/text';

interface PagerProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}

export function Pager({ page, pageCount, onChange, disabled = false }: PagerProps) {
  const layout = useResponsive();
  if (pageCount <= 1) return null;

  return (
    <View style={[styles.row, { gap: layout.gap - 4 }]} role="group" accessibilityLabel="Pagination">
      <View style={styles.cell}>
        <Button
          label="Previous"
          variant="secondary"
          disabled={disabled || page <= 1}
          onPress={() => onChange(page - 1)}
        />
      </View>
      <Body tone="muted">
        Page {page} of {pageCount}
      </Body>
      <View style={styles.cell}>
        <Button
          label="Next"
          variant="secondary"
          disabled={disabled || page >= pageCount}
          onPress={() => onChange(page + 1)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  cell: { flexGrow: 1, flexBasis: 120, maxWidth: 180 },
});
