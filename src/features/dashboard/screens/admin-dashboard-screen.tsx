import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { dashboardApi } from '@/features/dashboard/api';
import { DashboardFrame } from '@/features/dashboard/components/dashboard-frame';
import { ListPanel, type PanelItem } from '@/features/dashboard/components/list-panel';
import { ROLE_COPY, statusBadgeTone } from '@/features/dashboard/copy';
import { useResource } from '@/shared/api/use-resource';
import { useResponsive } from '@/shared/theme';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Screen } from '@/shared/ui/screen';
import { formatDate } from '@/shared/utils/format';

export function AdminDashboardScreen() {
  const router = useRouter();
  const layout = useResponsive();
  const resource = useResource(() => dashboardApi.get(), []);

  return (
    <Screen scroll>
      <DashboardFrame
        title={ROLE_COPY.ADMIN.title}
        subtitle={ROLE_COPY.ADMIN.summary}
        resource={resource}
      >
        {(data) => {
          const modules: PanelItem[] = (data.recent_modules ?? []).map((module) => ({
            key: module.id,
            title: `${module.module_code} — ${module.module_name}`,
            subtitle: `${module.credit_hours} credit hours · ${module.semester}`,
            badge: <Badge label={module.academic_year} tone="neutral" />,
            onPress: () => router.push('/admin/modules'),
          }));
          const enrollments: PanelItem[] = (data.recent_enrollments ?? []).map((enrollment) => ({
            key: enrollment.id,
            title: enrollment.student,
            subtitle: `${enrollment.module_code} · ${enrollment.semester} · enrolled ${formatDate(enrollment.enrolled_at)}`,
            badge: <Badge label={enrollment.status_label} tone={statusBadgeTone(enrollment.status)} />,
            onPress: () => router.push('/admin/enrollments'),
          }));

          return (
            <View style={[styles.panels, { gap: layout.gap }]}>
              <ListPanel
                title="Recent modules"
                items={modules}
                fallback="No modules are scheduled in the current academic year."
                footnote={
                  <Button
                    label="All modules"
                    variant="secondary"
                    onPress={() => router.push('/admin/modules')}
                  />
                }
              />
              <ListPanel
                title="Recent enrollments"
                items={enrollments}
                fallback="No students have been enrolled yet."
                footnote={
                  <Button
                    label="All enrollments"
                    variant="secondary"
                    onPress={() => router.push('/admin/enrollments')}
                  />
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
