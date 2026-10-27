import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { catalogApi, type Enrollment } from '@/features/catalog/api';
import { markingApi, type AssessmentResult } from '@/features/marking/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { ResourceList } from '@/features/shell/components/resource-list';
import { teachingApi, type Assessment } from '@/features/teaching/api';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import { useResource } from '@/shared/api/use-resource';
import { formatDate } from '@/shared/utils/format';
import { Badge, Body, Field, Pager, Picker, RecordRow, Screen } from '@/shared/ui';

type Draft = { id: string | null; marks_obtained: string; remark: string };

export function ResultsScreen() {
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const activeModule = moduleFilter ?? '';

  const list = usePaged<AssessmentResult>(
    (page) => markingApi.list({ page, module_id: activeModule || undefined }),
    [activeModule],
  );
  const assessments = useResource(() => teachingApi.assessments.list({ page: 1, page_size: 100 }), []);
  const enrollments = useResource(() => catalogApi.enrollments.list({ page: 1, page_size: 100 }), []);
  const modules = useResource(() => catalogApi.modules.list({ page: 1, page_size: 100 }), []);

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

  const moduleOptions = (modules.data?.results ?? []).map((item) => ({
    value: item.id,
    label: `${item.module_code} — ${item.module_name}`,
  }));

  const form = useEntityForm<Draft>({
    blank: { id: null, marks_obtained: '', remark: '' },
    validate: (draft) => ({
      marks_obtained:
        draft.marks_obtained !== '' && Number(draft.marks_obtained) >= 0 ? null : 'Enter a mark of 0 or more.',
    }),
    save: (draft) =>
      draft.id === null
        ? Promise.reject(new Error('Choose an assessment roster to add a mark.'))
        : markingApi.update(draft.id, { marks_obtained: draft.marks_obtained, remark: draft.remark }),
    remove: (id) => markingApi.remove(id),
    onSaved: () => {
      list.reload();
      assessments.reload();
      enrollments.reload();
    },
  });

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Marks"
        subtitle="Every mark recorded in your modules. Correcting a graded item keeps its status."
      />

      <View style={{ gap: 12 }}>
        <Picker
          label="Module"
          loading={modules.loading}
          options={moduleOptions}
          value={activeModule}
          onChange={(value) => {
            setModuleFilter(value);
            list.setPage(1);
          }}
        />
        {activeModule !== '' ? (
          <Body tone="muted">
            Filtering by module. Choose a different one to see the rest.
          </Body>
        ) : null}
      </View>

      <ResourceList
        grid={false}
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No marks recorded yet."
        onRetry={list.reload}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        renderItem={(result) => {
          const assessment = assessmentById.get(result.assessment_id);
          const enrollment = enrollmentById.get(result.enrollment_id);

          return (
            <RecordRow
              title={enrollment?.student.full_name ?? result.enrollment_id.slice(0, 8)}
              subtitle={`${assessment?.title ?? result.assessment_id.slice(0, 8)} · ${result.marks_obtained} of ${result.max_mark} · ${formatDate(result.graded_at)}`}
              badge={
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Badge label={`${result.percentage}%`} tone="info" />
                  {enrollment !== undefined ? <Badge label={enrollment.module.module_code} tone="neutral" /> : null}
                </View>
              }
              onPress={() =>
                form.open({ id: result.id, marks_obtained: result.marks_obtained, remark: result.remark })
              }
            />
          );
        }}
      />

      <FormSheet
        title="Correct this mark"
        form={form}
        hint="A mark above the item maximum returns 400. Deleting a mark reopens the grading check."
      >
        {(draft, update) => (
          <>
            <Field
              label="Marks obtained"
              value={draft.marks_obtained}
              keyboardType="decimal-pad"
              error={form.problems.marks_obtained}
              onChangeText={(marks_obtained) => update({ marks_obtained })}
            />
            <Field
              label="Remark"
              value={draft.remark}
              placeholder="Late by one day"
              onChangeText={(remark) => update({ remark })}
            />
          </>
        )}
      </FormSheet>
    </Screen>
  );
}
