import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Dashboard } from '@/features/dashboard/types';
import { AppHeader } from '@/features/shell/components/app-header';
import type { ResourceState } from '@/shared/api/use-resource';
import { useResponsive, useTheme } from '@/shared/theme';
import { BarChart } from '@/shared/ui/bar-chart';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { DonutChart } from '@/shared/ui/donut-chart';
import { ErrorBanner } from '@/shared/ui/error-banner';
import { LoadingBlock } from '@/shared/ui/feedback';
import type { IconName } from '@/shared/ui/icon';
import { StatTile } from '@/shared/ui/stat-tile';

const STAT_ICONS: Record<string, IconName> = {
  academic_year: 'calendar',
  draft_plans: 'document',
  marks: 'chart',
  modules: 'layers',
  open_assessments: 'checklist',
  percentage: 'chart',
  published_plans: 'document',
  students: 'users',
  teachers: 'users',
  upcoming: 'calendar',
};

interface DashboardFrameProps {
  title: string;
  subtitle: string;
  resource: ResourceState<Dashboard>;
  /** Role-specific panels, rendered under the shared tiles and charts. */
  children: (data: Dashboard) => ReactNode;
}

/** Tiles, donut and bars are identical for every role, so only the lists differ. */
export function DashboardFrame({ title, subtitle, resource, children }: DashboardFrameProps) {
  const layout = useResponsive();
  const { colors } = useTheme();
  const { data, error, loading, reload } = resource;

  return (
    <View style={{ gap: layout.gap }}>
      <AppHeader
        title={title}
        subtitle={subtitle}
        actions={<Button label="Refresh" variant="secondary" onPress={reload} />}
      />

      {error !== null ? <ErrorBanner title="The dashboard could not load" messages={error} /> : null}
      {loading && data === null ? <LoadingBlock label="Loading dashboard…" /> : null}

      {data !== null ? (
        <>
          <View style={[styles.grid, { gap: layout.gap - 4 }]}>
            {data.stats.map((stat) => (
              <StatTile
                key={stat.key}
                icon={STAT_ICONS[stat.key]}
                label={stat.label}
                tone={stat.tone}
                value={stat.value}
              />
            ))}
          </View>

          <View style={[styles.charts, { gap: layout.gap }]}>
            <Card
              title={data.donut.title}
              style={{ borderColor: colors.border, flexGrow: 1, flexBasis: '45%', minWidth: 300 }}
            >
              <DonutChart data={data.donut} size={layout.breakpoint === 'compact' ? 150 : 168} />
            </Card>
            <Card
              title={data.bars.title}
              style={{ borderColor: colors.border, flexGrow: 1, flexBasis: '45%', minWidth: 300 }}
            >
              <BarChart data={data.bars} height={layout.breakpoint === 'compact' ? 140 : 168} />
            </Card>
          </View>

          {children(data)}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  charts: { flexDirection: 'row', flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
