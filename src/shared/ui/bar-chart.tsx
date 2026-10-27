import { StyleSheet, Text, View } from 'react-native';

import type { Bars } from '@/features/dashboard/types';
import { scale, toneSet, useResponsive, useTheme } from '@/shared/theme';
import { Body } from '@/shared/ui/text';

interface BarChartProps {
  data: Bars;
  /** Plot height in dp/CSS px, excluding the group labels. */
  height?: number;
}

function numeric(value: number | string | undefined): number {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Grouped vertical bars. Plain views, so the same component works in the APK and on web. */
export function BarChart({ data, height = 168 }: BarChartProps) {
  const { colors } = useTheme();
  const layout = useResponsive();

  const max = Math.max(
    1,
    ...data.groups.flatMap((group) => data.series.map((series) => numeric(group.values[series.key]))),
  );

  if (data.groups.length === 0) {
    return <Body tone="muted">Nothing to chart yet.</Body>;
  }

  return (
    <View style={{ gap: layout.gap - 8 }}>
      <View style={styles.legend}>
        {data.series.map((series) => (
          <View key={series.key} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: toneSet(colors, series.tone).bar }]} />
            <Text style={{ color: colors.textMuted, fontSize: scale(12, layout.typeScale), fontWeight: '600' }}>
              {series.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.plot, { height }]}>
        {data.groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <View style={[styles.bars, { height: height - 22 }]}>
              {data.series.map((series) => {
                const value = numeric(group.values[series.key]);
                return (
                  <View
                    key={series.key}
                    style={[
                      styles.bar,
                      {
                        backgroundColor: toneSet(colors, series.tone).bar,
                        height: Math.max(3, (value / max) * (height - 22)),
                      },
                    ]}
                  />
                );
              })}
            </View>
            <Text
              numberOfLines={1}
              style={{
                color: colors.textMuted,
                fontSize: scale(11, layout.typeScale),
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              {group.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: 4, flex: 1, maxWidth: 26, minWidth: 6 },
  bars: { alignItems: 'flex-end', alignSelf: 'stretch', flexDirection: 'row', gap: 3, justifyContent: 'center' },
  group: { alignItems: 'center', flex: 1, gap: 6, justifyContent: 'flex-end', minWidth: 34 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  plot: { flexDirection: 'row', gap: 8 },
  swatch: { borderRadius: 3, height: 10, width: 10 },
});
