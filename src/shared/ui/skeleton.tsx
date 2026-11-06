import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type DimensionValue } from 'react-native';

import { radius, useResponsive, useTheme } from '@/shared/theme';
import { Screen } from '@/shared/ui/screen';

interface SkeletonBlockProps {
  height: number;
  width?: DimensionValue;
  rounded?: number;
}

function SkeletonBlock({ height, width = '100%', rounded = 7 }: SkeletonBlockProps) {
  const { colors } = useTheme();
  return <View style={{ height, width, borderRadius: rounded, backgroundColor: colors.border }} />;
}

function SkeletonPulse({ children }: { children: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(0.48));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.92,
          duration: 720,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.48,
          duration: 720,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

/** Table-shaped on desktop and card-shaped on mobile, matching the responsive data views. */
export function DataSkeleton({ rows = 5 }: { rows?: number }) {
  const layout = useResponsive();
  const { colors } = useTheme();
  const wide = layout.breakpoint === 'wide';

  return (
    <View accessibilityLabel="Loading content" accessibilityRole="progressbar" style={styles.fill}>
      <SkeletonPulse>
        {wide ? (
          <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.tableHeader, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
              <SkeletonBlock height={11} width="22%" />
              <SkeletonBlock height={11} width="31%" />
              <SkeletonBlock height={11} width="18%" />
              <SkeletonBlock height={11} width="14%" />
            </View>
            {Array.from({ length: rows }, (_, index) => (
              <View
                key={index}
                style={[styles.tableRow, index < rows - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
              >
                <SkeletonBlock height={14} width="19%" />
                <SkeletonBlock height={14} width="35%" />
                <SkeletonBlock height={14} width="16%" />
                <SkeletonBlock height={28} width="12%" rounded={radius.pill} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap: layout.gap - 6 }}>
            {Array.from({ length: Math.min(rows, 4) }, (_, index) => (
              <View key={index} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <SkeletonBlock height={17} width="55%" />
                  <SkeletonBlock height={26} width={70} rounded={radius.pill} />
                </View>
                <SkeletonBlock height={13} width="78%" />
                <SkeletonBlock height={13} width="42%" />
              </View>
            ))}
          </View>
        )}
      </SkeletonPulse>
    </View>
  );
}

/** Route-level placeholder that mirrors a page header, summary tiles and its main data area. */
export function PageSkeleton() {
  const layout = useResponsive();
  const { colors } = useTheme();
  const tileCount = layout.breakpoint === 'compact' ? 2 : 4;

  return (
    <Screen scroll>
      <View accessibilityLabel="Loading page" accessibilityRole="progressbar" style={{ gap: layout.gap }}>
        <SkeletonPulse>
          <View style={[styles.header, { borderBottomColor: colors.border, gap: 10, paddingBottom: layout.gap - 4 }]}>
            <View style={styles.headerTop}>
              <SkeletonBlock height={25} width={layout.breakpoint === 'compact' ? '58%' : 260} />
              <SkeletonBlock height={38} width={104} rounded={radius.input} />
            </View>
            <SkeletonBlock height={13} width={layout.breakpoint === 'compact' ? '82%' : 420} />
          </View>
          <View style={[styles.tiles, { gap: layout.gap - 6, marginTop: layout.gap }]}>
            {Array.from({ length: tileCount }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.tile,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    flexBasis: layout.breakpoint === 'compact' ? '46%' : 170,
                  },
                ]}
              >
                <SkeletonBlock height={30} width={30} rounded={radius.input} />
                <SkeletonBlock height={13} width="62%" />
                <SkeletonBlock height={22} width="38%" />
              </View>
            ))}
          </View>
        </SkeletonPulse>
        <DataSkeleton rows={5} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%' },
  table: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden', width: '100%' },
  tableHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  tableRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 59,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: { borderRadius: radius.card, borderWidth: 1, gap: 12, padding: 16 },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth },
  headerTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { borderRadius: radius.card, borderWidth: 1, flexGrow: 1, gap: 12, minHeight: 128, padding: 16 },
});
