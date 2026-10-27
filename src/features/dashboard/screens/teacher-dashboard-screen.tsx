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

export function TeacherDashboardScreen() {
  const router = useRouter();
  const layout = useResponsive();
  const resource = useResource(() => dashboardApi.get(), []);

  return (
    <Screen scroll>
      <DashboardFrame
        title={ROLE_COPY.TEACHER.title}
        subtitle={ROLE_COPY.TEACHER.summary}
        resource={resource}
      >
        {(data) => {
          const upcoming: PanelItem[] = (data.upcoming_assessments ?? []).map((assessment) => ({
            key: assessment.id,
            title: `${assessment.sequence_no}. ${assessment.title}`,
            subtitle: `${assessment.module_code} · ${assessment.type_label} · ${assessment.max_mark} marks · ${formatDate(assessment.assessment_date)}`,
            badge: <Badge label={assessment.status_label} tone={statusBadgeTone(assessment.status)} />,
            onPress: () => router.push('/teacher/assessments'),
          }));
          const marks: PanelItem[] = (data.recent_marks ?? []).map((mark) => ({
            key: mark.id,
            title: mark.student,
            subtitle: `${mark.module_code} · ${mark.assessment_title} · ${formatDate(mark.graded_at)}`,
            badge: <Badge label={`${mark.percentage ?? '—'}%`} tone={percentageTone(mark.percentage)} />,
            onPress: () => router.push('/teacher/results'),
          }));

          return (
            <View style={[styles.panels, { gap: layout.gap }]}>
              <ListPanel
                title="Upcoming assessments"
                items={upcoming}
                fallback="Nothing is scheduled. Publish a plan to list its assessments."
                footnote={
                  <Button
                    label="All assessments"
                    variant="secondary"
                    onPress={() => router.push('/teacher/assessments')}
                  />
                }
              />
              <ListPanel
                title="Recent marks"
                items={marks}
                fallback="No marks have been recorded yet."
                footnote={
                  <Button label="Marks entry" variant="secondary" onPress={() => router.push('/teacher/results')} />
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
