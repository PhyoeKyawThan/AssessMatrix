import { View } from 'react-native';

import { usersApi } from '@/features/users/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { useResource } from '@/shared/api/use-resource';
import { useResponsive } from '@/shared/theme';
import { Badge, Body, Card, EmptyState, ErrorBanner, LoadingBlock, RecordRow, Screen } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

export function AcademicHistoryScreen({ studentId, embedded = false }: { studentId?: string; embedded?: boolean }) {
  const layout = useResponsive();
  const history = useResource(
    () => studentId ? usersApi.academicHistory(studentId) : usersApi.myAcademicHistory(),
    [studentId],
  );

  const content = (
    <View style={{ gap: layout.gap }}>
      {!embedded ? (
        <AppHeader
          title="Assessment history"
          subtitle="Results are preserved by academic year, semester, module, and assessment."
        />
      ) : null}
      {history.error ? <ErrorBanner title="Could not load assessment history" messages={history.error} /> : null}
      {history.loading && !history.data ? <LoadingBlock label="Loading academic history…" /> : null}
      {history.data?.academic_years.length === 0 ? <EmptyState message="No assessment results have been recorded yet." /> : null}
      {history.data?.academic_years.map((year) => (
        <Card key={year.academic_id} title={year.academic_year}>
          <View style={{ gap: layout.gap }}>
            {year.semesters.map((semester) => (
              <View key={semester.semester_id} style={{ gap: 10 }}>
                <Body tone="secondary">Semester {semester.semester_no} · {semester.semester_name}</Body>
                {semester.modules.map((module) => (
                  <Card
                    key={module.enrollment_id}
                    title={`${module.module_code} — ${module.module_name} · Year ${module.study_year}`}
                    actions={<Badge label={`${module.obtained_total} / ${module.maximum_total}`} tone="info" />}
                  >
                    <Body tone="muted">{module.teacher ? `Teacher: ${module.teacher}` : 'Teacher not assigned'} · {module.status}</Body>
                    {module.results.length === 0 ? <Body tone="faint">No marks recorded for this module.</Body> : null}
                    {module.results.map((result) => (
                      <RecordRow
                        key={result.id}
                        title={result.title}
                        subtitle={`${result.assessment_type} · graded by ${result.graded_by} on ${formatDate(result.graded_at)}${result.remark ? ` · ${result.remark}` : ''}`}
                        badge={<Badge label={`${result.marks_obtained} / ${result.max_mark}`} tone="neutral" />}
                      />
                    ))}
                  </Card>
                ))}
              </View>
            ))}
          </View>
        </Card>
      ))}
    </View>
  );

  return embedded ? content : <Screen scroll>{content}</Screen>;
}
