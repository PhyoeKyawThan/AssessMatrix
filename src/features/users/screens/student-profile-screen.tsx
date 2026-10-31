import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { catalogApi } from '@/features/catalog/api';
import { AcademicHistoryScreen } from '@/features/learner/screens/academic-history-screen';
import { AppHeader } from '@/features/shell/components/app-header';
import { usersApi } from '@/features/users/api';
import { useResource } from '@/shared/api/use-resource';
import { useResponsive } from '@/shared/theme';
import { Badge, Body, Card, ErrorBanner, LoadingBlock, RecordRow, Screen } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

export function StudentProfileScreen() {
  const params = useLocalSearchParams<{ studentId: string }>();
  const studentId = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId;
  const layout = useResponsive();
  const student = useResource(() => usersApi.get(studentId), [studentId]);
  const placements = useResource(() => catalogApi.placements.list({ student_id: studentId, page_size: 100 }), [studentId]);
  const current = placements.data?.results.find((item) => item.is_current);

  return (
    <Screen scroll>
      <AppHeader title={student.data?.full_name || 'Student profile'} subtitle={student.data?.email} back />
      {student.error ? <ErrorBanner title="Could not load student" messages={student.error} /> : null}
      {student.loading && !student.data ? <LoadingBlock /> : null}
      {student.data ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: layout.gap }}>
          <Card title="Student information" style={{ flexGrow: 1, flexBasis: 300 }}>
            <RecordRow title="Student ID" subtitle={student.data.username} />
            <RecordRow title="Email" subtitle={student.data.email} />
            <RecordRow title="Account" badge={<Badge label={student.data.is_active ? 'Active' : 'Inactive'} tone={student.data.is_active ? 'success' : 'danger'} /> } />
          </Card>
          <Card title="Current placement" style={{ flexGrow: 1, flexBasis: 300 }}>
            {current ? (
              <>
                <Body>{current.major.code} — {current.major.name}</Body>
                <Body tone="secondary">Year {current.study_year} · {current.academic_year} · {current.semester_name}</Body>
                <Body tone="muted">Admitted {formatDate(current.admitted_on)}</Body>
              </>
            ) : <Body tone="muted">No current placement has been assigned.</Body>}
          </Card>
        </View>
      ) : null}
      <Card title="Semester placement history">
        {placements.data?.results.map((placement) => (
          <RecordRow
            key={placement.id}
            title={`${placement.academic_year} · ${placement.semester_name}`}
            subtitle={`${placement.major.code} — ${placement.major.name} · Year ${placement.study_year}`}
            badge={placement.is_current ? <Badge label="Current" tone="success" /> : <Badge label="History" tone="neutral" />}
          />
        ))}
      </Card>
      <AcademicHistoryScreen studentId={studentId} embedded />
    </Screen>
  );
}
