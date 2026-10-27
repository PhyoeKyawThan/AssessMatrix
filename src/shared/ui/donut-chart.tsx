import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { scale, useResponsive, useTheme } from '@/shared/theme';
import type { Donut, Slice } from '@/features/dashboard/types';

type Arc = Slice & { color: string; dash: string; length: number; offset: number };

interface DonutChartProps {
  data: Donut;
  /** Outer diameter in dp/CSS px. */
  size?: number;
}

/**
 * Ring chart drawn from one stroked circle per slice. Offsets are negative so slices run
 * clockwise from twelve o'clock once the SVG itself is rotated.
 */
export function DonutChart({ data, size = 168 }: DonutChartProps) {
  const { colors } = useTheme();
  const layout = useResponsive();
  const stroke = Math.max(18, size * 0.16);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const legend = data.slices.filter((slice) => slice.value > 0);

  const arcs = data.slices.reduce<Arc[]>((placed, slice, index) => {
    const start = placed.reduce((sum, arc) => sum + arc.length, 0);
    const fraction = data.total > 0 ? slice.value / data.total : 0;
    const length = fraction * circumference;
    const trimmed = Math.max(length - 2, 0);
    return [
      ...placed,
      {
        ...slice,
        color: colors.chart[index % colors.chart.length],
        dash: `${trimmed} ${circumference - trimmed}`,
        length,
        offset: -start,
      },
    ];
  }, []);

  const summary = legend.length > 0
    ? legend.map((slice) => `${slice.label} ${slice.value}`).join(', ')
    : 'No records yet';

  return (
    <View style={styles.wrap}>
      <View style={[styles.chartBlock, { height: size, width: size }]}>
        <Svg
          width={size}
          height={size}
          style={styles.rotor}
          role="img"
          accessibilityLabel={`${data.title}: ${summary}`}
        >
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.chartGrid}
            strokeWidth={stroke}
            fill="none"
          />
          {arcs.map((arc) => (
            <Circle
              key={arc.key}
              cx={center}
              cy={center}
              r={radius}
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={arc.dash}
              strokeDashoffset={arc.offset}
              fill="none"
              strokeLinecap="butt"
            />
          ))}
        </Svg>
        <View style={[styles.center, { height: size, width: size }]}>
          <Text
            style={{
              color: colors.text,
              fontSize: scale(26, layout.typeScale),
              fontWeight: '800',
            }}
          >
            {data.total}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: scale(11, layout.typeScale), fontWeight: '700' }}>
            TOTAL
          </Text>
        </View>
      </View>
      <View style={styles.legend}>
        {arcs.map((arc) => (
          <View key={arc.key} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: arc.color }]} />
            <Text numberOfLines={1} style={{ color: colors.textSecondary, flexShrink: 1, fontSize: scale(13, layout.typeScale) }}>
              {arc.label}
            </Text>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: scale(13, layout.typeScale) }}>
              {arc.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartBlock: { alignItems: 'center', alignSelf: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', left: 0, position: 'absolute', top: 0 },
  dot: { borderRadius: 999, height: 10, marginRight: 8, width: 10 },
  legend: { alignSelf: 'stretch', gap: 6 },
  legendRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  rotor: { transform: [{ rotate: '-90deg' }] },
  wrap: { alignItems: 'center', flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
});
