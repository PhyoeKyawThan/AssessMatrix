import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import { ErrorBanner } from '@/shared/ui/error-banner';
import { EmptyState, LoadingBlock } from '@/shared/ui/feedback';
import { DataSkeleton } from '@/shared/ui/skeleton';

interface ResourceListProps<T> {
  items: T[];
  loading: boolean;
  error: string[] | null;
  emptyMessage: string;
  renderItem: (item: T, index: number) => ReactNode;
  onRetry?: () => void;
  /** Two columns appear once the window is tablet sized. */
  grid?: boolean;
  footer?: ReactNode;
}

export function ResourceList<T>({
  items,
  loading,
  error,
  emptyMessage,
  renderItem,
  onRetry,
  grid = true,
  footer,
}: ResourceListProps<T>) {
  const layout = useResponsive();
  const columns = grid && layout.detailColumns === 2 ? 2 : 1;

  if (loading && items.length === 0) return <DataSkeleton />;

  return (
    <View style={{ gap: layout.gap - 4 }}>
      {loading ? <LoadingBlock label="Refreshing…" /> : null}
      {error !== null ? (
        <View style={{ gap: layout.gap - 6 }}>
          <ErrorBanner title="Could not load this list" messages={error} />
          {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
        </View>
      ) : null}
      {items.length === 0 && error === null ? (
        <EmptyState message={loading ? 'Refreshing…' : emptyMessage} />
      ) : (
        <View style={[styles.rows, { gap: layout.gap - 6 }]}>
          {items.map((item, index) => (
            <View key={index} style={{ flexBasis: columns === 2 ? '47.5%' : '100%', flexGrow: 1 }}>
              {renderItem(item, index)}
            </View>
          ))}
        </View>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', width: '100%' },
});
