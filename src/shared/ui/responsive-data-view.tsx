import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { scale, useResponsive, useTheme } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import { ErrorBanner } from '@/shared/ui/error-banner';
import { EmptyState, LoadingBlock } from '@/shared/ui/feedback';
import { DataSkeleton } from '@/shared/ui/skeleton';

export interface DataColumn<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  flex?: number;
  minWidth?: number;
}

interface ResponsiveDataViewProps<T> {
  items: T[];
  loading: boolean;
  error: string[] | null;
  emptyMessage: string;
  columns: DataColumn<T>[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onRowPress?: (item: T) => void;
  onRetry?: () => void;
  footer?: ReactNode;
}

export function ResponsiveDataView<T>({
  items,
  loading,
  error,
  emptyMessage,
  columns,
  keyExtractor,
  renderCard,
  onRowPress,
  onRetry,
  footer,
}: ResponsiveDataViewProps<T>) {
  const layout = useResponsive();
  const { colors } = useTheme();

  if (loading && items.length === 0) return <DataSkeleton />;

  return (
    <View style={{ gap: layout.gap - 4 }}>
      {loading ? <LoadingBlock label="Refreshing…" /> : null}
      {error ? (
        <View style={{ gap: 10 }}>
          <ErrorBanner title="Could not load this list" messages={error} />
          {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
        </View>
      ) : null}
      {items.length === 0 && !error ? <EmptyState message={loading ? 'Refreshing…' : emptyMessage} /> : null}
      {items.length > 0 && layout.breakpoint === 'wide' ? (
        <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.header, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
            {columns.map((column) => (
              <Text
                key={column.key}
                style={[
                  styles.headerText,
                  {
                    color: colors.textMuted,
                    flex: column.flex ?? 1,
                    minWidth: column.minWidth ?? 100,
                    fontSize: scale(11, layout.typeScale),
                  },
                ]}
              >
                {column.label.toUpperCase()}
              </Text>
            ))}
          </View>
          {items.map((item, index) => {
            const content = columns.map((column) => (
              <View key={column.key} style={{ flex: column.flex ?? 1, minWidth: column.minWidth ?? 100 }}>
                {column.render(item)}
              </View>
            ));
            const rowStyle = [
              styles.row,
              index < items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
            ];
            return onRowPress ? (
              <Pressable key={keyExtractor(item)} onPress={() => onRowPress(item)} style={({ pressed }) => [rowStyle, pressed && { backgroundColor: colors.surfaceAlt }]}>
                {content}
              </Pressable>
            ) : <View key={keyExtractor(item)} style={rowStyle}>{content}</View>;
          })}
        </View>
      ) : (
        <View style={{ gap: layout.gap - 6 }}>
          {items.map((item) => <View key={keyExtractor(item)}>{renderCard(item)}</View>)}
        </View>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', width: '100%' },
  header: { borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 11 },
  headerText: { fontWeight: '800', letterSpacing: 0.7 },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingHorizontal: 16, paddingVertical: 11 },
});
