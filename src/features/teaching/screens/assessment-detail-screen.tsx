import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { catalogApi, type Enrollment } from '@/features/catalog/api';
import { markingApi, type AssessmentResult } from '@/features/marking/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { ResourceList } from '@/features/shell/components/resource-list';
import { teachingApi, type Assessment } from '@/features/teaching/api';
import { usePaged } from '@/shared/api/use-page';
import { useResource, useSubmit } from '@/shared/api/use-resource';
import {
  Badge,
  Body,
  Button,
  Card,
  ErrorBanner,
  Field,
  LoadingBlock,
  Pager,
  Screen,
} from '@/shared/ui';

interface MarkValue {
  marks: string;
  remark: string;
  resultId: string | null;
  percentage: string | null;
}

const BLANK: MarkValue = { marks: '', remark: '', resultId: null, percentage: null };

export function AssessmentDetailScreen() {
  const params = useLocalSearchParams<{ assessmentId?: string }>();
  const assessmentId = String(params.assessmentId ?? '');
  const { user } = useAuth();

  const assessment = useResource<Assessment>(() => teachingApi.assessments.get(assessmentId), [assessmentId]);
  const results = usePaged<AssessmentResult>(
    (page) => markingApi.list({ assessment_id: assessmentId, page, page_size: 100 }),
    [assessmentId],
  );
  const enrollments = usePaged<Enrollment>(
    (page) =>
      catalogApi.enrollments.list({
        page,
        page_size: 100,
        module_id: assessment.data?.module_id,
      }),
    [assessment.data?.module_id],
  );

  // Only what the teacher has typed is held locally; stored marks are read straight from the page.
  const [edits, setEdits] = useState<Record<string, Partial<MarkValue>>>({});
  const stored = useMemo(() => {
    const map: Record<string, MarkValue> = {};
    for (const result of results.items) {
      map[result.enrollment_id] = {
        marks: result.marks_obtained,
        remark: result.remark,
        resultId: result.id,
        percentage: result.percentage,
      };
    }
    return map;
  }, [results.items]);

  const valueFor = (enrollmentId: string): MarkValue => {
    const saved = stored[enrollmentId] ?? BLANK;
    const edit = edits[enrollmentId];
    return edit === undefined
      ? saved
      : { marks: edit.marks ?? saved.marks, remark: edit.remark ?? saved.remark, resultId: saved.resultId, percentage: saved.percentage };
  };

  const plan = useResource(
    () =>
      assessment.data === null
        ? Promise.resolve(null)
        : teachingApi.plans.get(assessment.data.lecture_plan_id),
    [assessment.data?.lecture_plan_id],
  );

  const submit = useSubmit();
  const data = assessment.data;
  const canWrite = plan.data !== null && (user?.role === 'ADMIN' || plan.data.lecturer_id === user?.id);
  const rows = useMemo(() => enrollments.items, [enrollments.items]);

  if (assessment.loading && data === null) {
    return (
      <Screen>
        <LoadingBlock label="Loading assessment…" />
      </Screen>
    );
  }

  if (data === null) {
    return (
      <Screen scroll>
        <AppHeader title="Assessment" back />
        <ErrorBanner title="Could not load this assessment" messages={assessment.error ?? ['No data returned.']} />
        <Button label="Try again" variant="secondary" onPress={assessment.reload} />
      </Screen>
    );
  }

  const marked = rows.filter((row) => valueFor(row.id).marks !== '');
  const needsMark = rows.filter((row) => row.status !== 'DROPPED');
  const missing = needsMark.filter((row) => valueFor(row.id).marks === '');

  const saveAll = async () => {
    const ok = await submit.run(
      () =>
        markingApi.bulk({
          assessment_id: data.id,
          results: marked.map((row) => ({
            enrollment_id: row.id,
            marks_obtained: valueFor(row.id).marks,
            remark: valueFor(row.id).remark,
          })),
        }),
      (result) => `${(result as AssessmentResult[]).length} marks saved.`,
    );
    if (ok) {
      setEdits({});
      assessment.reload();
      results.reload();
    }
  };

  return (
    <Screen scroll width="content">
      <AppHeader
        title={data.title}
        subtitle={`${data.assessment_type} · sequence ${data.sequence_no} · maximum ${data.max_mark}`}
        back
        actions={<Badge label={data.status} tone={data.status === 'GRADED' ? 'success' : data.status === 'SCHEDULED' ? 'neutral' : 'info'} />}
      />

      {submit.error !== null ? <ErrorBanner title="Marks were not saved" messages={submit.error} /> : null}
      {submit.notice !== null ? <Body tone="success">{submit.notice}</Body> : null}
      {results.error !== null ? <ErrorBanner title="Stored marks" messages={results.error} /> : null}

      <Card title="Status">
        <Body tone="muted">
          Marks are accepted from OPEN onwards. Grading needs a mark for every ENROLLED or COMPLETED student.
        </Body>
        {canWrite ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {data.status === 'SCHEDULED' ? (
            <Button
              label="Open for marks"
              onPress={async () => {
                if (await submit.run(() => teachingApi.assessments.open(data.id), 'Assessment is OPEN.')) assessment.reload();
              }}
            />
          ) : null}
          {data.status === 'OPEN' ? (
            <Button
              label="Close"
              variant="secondary"
              onPress={async () => {
                if (await submit.run(() => teachingApi.assessments.close(data.id), 'Assessment is CLOSED.')) assessment.reload();
              }}
            />
          ) : null}
          {data.status === 'OPEN' || data.status === 'CLOSED' ? (
            <Button
              label="Mark graded"
              variant="secondary"
              onPress={async () => {
                const ok = await submit.run(
                  () => teachingApi.assessments.markGraded(data.id),
                  (result) =>
                    (result as Assessment).run_finished === true
                      ? 'GRADED — this module’s run is finished.'
                      : 'Assessment is GRADED.',
                );
                if (ok) {
                  assessment.reload();
                  results.reload();
                }
              }}
            />
          ) : null}
        </View>
        ) : (
          <Body tone="muted">Only the assigned lecturer or an administrator can move this assessment.</Body>
        )}
      </Card>

      <Card
        title="Roster"
        actions={
          <Badge
            label={`${marked.length}/${needsMark.length} marked`}
            tone={missing.length === 0 ? 'success' : 'danger'}
          />
        }
      >
        <Body tone="muted">
          {missing.length === 0
            ? 'Every active student has a mark.'
            : `${missing.length} active student${missing.length === 1 ? '' : 's'} still need a mark.`}
        </Body>
        <ResourceList
          grid={false}
          items={rows}
          loading={enrollments.loading}
          error={enrollments.error}
          emptyMessage="No enrollments in this module."
          onRetry={enrollments.reload}
          footer={
            <Pager
              page={enrollments.page}
              pageCount={enrollments.pageCount}
              onChange={enrollments.setPage}
              disabled={enrollments.loading}
            />
          }
          renderItem={(enrollment) => {
            const value = valueFor(enrollment.id);
            const saved = stored[enrollment.id];
            const overMax = Number(value.marks) > Number(data.max_mark);

            const edit = (patch: Partial<MarkValue>) =>
              setEdits((current) => ({ ...current, [enrollment.id]: { ...current[enrollment.id], ...patch } }));

            return (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <Body>{enrollment.student.full_name || enrollment.student.email}</Body>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    <Badge label={enrollment.status} tone={enrollment.status === 'DROPPED' ? 'neutral' : 'info'} />
                    {saved !== undefined ? <Badge label={`${saved.percentage}%`} tone="success" /> : null}
                  </View>
                </View>
                <Field
                  label={`Mark of ${data.max_mark}`}
                  value={value.marks}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  editable={canWrite}
                  error={overMax ? `Above the maximum of ${data.max_mark}.` : null}
                  onChangeText={(marks) => edit({ marks })}
                />
                <Field
                  label="Remark"
                  value={value.remark}
                  placeholder="Optional"
                  editable={canWrite}
                  onChangeText={(remark) => edit({ remark })}
                />
              </View>
            );
          }}
        />
        <Button
          label={marked.length === 0 ? 'Enter at least one mark' : `Save ${marked.length} marks`}
          loading={submit.pending}
          disabled={marked.length === 0 || !canWrite}
          onPress={saveAll}
        />
        {canWrite ? null : (
          <Body tone="muted">This plan belongs to another lecturer, so the roster is read-only for you.</Body>
        )}
        {data.status === 'GRADED' ? (
          <Body tone="muted">Graded already: correcting a mark here keeps the status at GRADED.</Body>
        ) : null}
      </Card>
    </Screen>
  );
}
