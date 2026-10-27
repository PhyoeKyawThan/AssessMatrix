import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { catalogApi, type Enrollment } from '@/features/catalog/api';
import { markingApi, type AssessmentResult } from '@/features/marking/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { ResourceList } from '@/features/shell/components/resource-list';
import { teachingApi, type Assessment } from '@/features/teaching/api';
import { usePaged } from '@/shared/api/use-page';
import { useResource } from '@/shared/api/use-resource';
import { formatDate } from '@/shared/utils/format';
import { Badge, Body, OptionChips, Pager, RecordRow, Screen } from '@/shared/ui';

export function MyMarksScreen() {
  const { user } = useAuth();
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const results = usePaged<AssessmentResult>(
    (page) => markingApi.list({ page, page_size: 100, student_id: user?.id }),
    [user?.id],
  );
  // Own rows come back without module or assessment names, so join them from the readable lists.
  const assessments = useResource(() => teachingApi.assessments.list({ page: 1, page_size: 100 }), []);
  const enrollments = useResource(() => catalogApi.enrollments.mine(1), []);

  const assessmentById = useMemo(() => {
    const map = new Map<string, Assessment>();
    for (const item of assessments.data?.results ?? []) map.set(item.id, item);
    return map;
  }, [assessments.data]);

  const enrollmentById = useMemo(() => {
    const map = new Map<string, Enrollment>();
    for (const item of enrollments.data?.results ?? []) map.set(item.id, item);
    return map;
  }, [enrollments.data]);

  const moduleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of enrollments.data?.results ?? []) seen.set(item.module.id, item.module.module_code);
    return [{ value: 'ALL', label: 'All modules' }, ...[...seen].map(([value, label]) => ({ value, label }))];
  }, [enrollments.data]);

  const rows = (results.items ?? []).filter((result) => {
    if (moduleFilter === 'ALL') return true;
    return enrollmentById.get(result.enrollment_id)?.module.id === moduleFilter;
  });

  return (
    <Screen scroll width="content">
      <AppHeader
        title="My marks"
        subtitle="Each row is one assessment item. The percentage is that item's score, not the module weight."
      />

      <View style={{ gap: 10 }}>
        <OptionChips
          label="Module"
          value={moduleFilter}
          onChange={setModuleFilter}
          options={moduleOptions}
        />
        {assessments.error !== null ? <Body tone="error">Assessment names could not load.</Body> : null}
      </View>

      <ResourceList
        grid={false}
        items={rows}
        loading={results.loading}
        error={results.error}
        emptyMessage="No marks recorded for you yet."
        onRetry={results.reload}
        footer={<Pager page={results.page} pageCount={results.pageCount} onChange={results.setPage} disabled={results.loading} />}
        renderItem={(result) => {
          const assessment = assessmentById.get(result.assessment_id);
          const enrollment = enrollmentById.get(result.enrollment_id);
          const label = assessment === undefined ? result.assessment_id.slice(0, 8) : assessment.title;
          const moduleCode = enrollment?.module.module_code ?? '—';

          return (
            <RecordRow
              title={`${moduleCode} · ${label}`}
              subtitle={`${result.marks_obtained} of ${result.max_mark} · graded by ${result.graded_by.full_name} on ${formatDate(result.graded_at)}`}
              badge={
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Badge label={`${result.percentage}%`} tone="info" />
                  {assessment !== undefined ? <Badge label={assessment.status} tone="neutral" /> : null}
                </View>
              }
            />
          );
        }}
      />
    </Screen>
  );
}
