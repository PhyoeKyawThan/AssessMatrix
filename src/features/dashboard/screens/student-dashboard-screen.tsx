import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { dashboardApi } from '@/features/dashboard/api';
import { DashboardFrame } from '@/features/dashboard/components/dashboard-frame';
import { ListPanel, type PanelItem } from '@/features/dashboard/components/list-panel';
import { ROLE_COPY, percentageTone, statusBadgeTone } from '@/features/dashboard/copy';
import { useResource } from '@/shared/api/use-resource';
import { useResponsive } from '@/shared/theme';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Screen } from '@/shared/ui/screen';
import { formatDate } from '@/shared/utils/format';

export function StudentDashboardScreen() {
  const router = useRouter();
  const layout = useResponsive();
  const resource = useResource(() => dashboardApi.get(), []);

  return (
    <Screen scroll>
      <DashboardFrame
        title={ROLE_COPY.STUDENT.title}
        subtitle={ROLE_COPY.STUDENT.summary}
        resource={resource}
      >
        {(data) => {
          const upcoming: PanelItem[] = (data.upcoming_assessments ?? []).map((assessment) => ({
            key: assessment.id,
            title: `${assessment.sequence_no}. ${assessment.title}`,
            subtitle: `${assessment.module_code} · ${assessment.type_label} · ${formatDate(assessment.assessment_date)}`,
            badge: <Badge label={assessment.status_label} tone={statusBadgeTone(assessment.status)} />,
            onPress: () => router.push('/student/plans'),
          }));
          const marks: PanelItem[] = (data.recent_marks ?? []).map((mark) => ({
            key: mark.id,
            title: `${mark.module_code} — ${mark.assessment_title}`,
            subtitle: `${mark.marks_obtained} of ${mark.max_mark}${mark.remark === '' ? '' : ` · ${mark.remark}`} · ${formatDate(mark.graded_at)}`,
            badge: <Badge label={`${mark.percentage ?? '—'}%`} tone={percentageTone(mark.percentage)} />,
            onPress: () => router.push('/student/results'),
          }));

          return (
            <View style={[styles.panels, { gap: layout.gap }]}>
              <ListPanel
                title="Upcoming assessments"
                items={upcoming}
                fallback="No published assessment is scheduled for your modules."
                footnote={
                  <Button
                    label="Published plans"
                    variant="secondary"
                    onPress={() => router.push('/student/plans')}
                  />
                }
              />
              <ListPanel
                title="Recent marks"
                items={marks}
                fallback="Nothing has been graded for you yet."
                footnote={
                  <Button label="All marks" variant="secondary" onPress={() => router.push('/student/results')} />
                }
              />
            </View>
          );
        }}
      </DashboardFrame>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panels: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap' },
});
