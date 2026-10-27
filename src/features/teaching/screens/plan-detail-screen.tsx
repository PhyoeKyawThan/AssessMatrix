import { router, type Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { ResourceList } from '@/features/shell/components/resource-list';
import {
  ASSESSMENT_TYPES,
  teachingApi,
  type Assessment,
  type AssessmentStatus,
  type AssessmentType,
  type LecturePlan,
} from '@/features/teaching/api';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import { useResource, useSubmit } from '@/shared/api/use-resource';
import { isDateOnly } from '@/shared/utils/format';
import {
  Badge,
  Body,
  Button,
  Card,
  ErrorBanner,
  Field,
  FieldRow,
  LoadingBlock,
  OptionChips,
  Picker,
  RecordRow,
  Screen,
  SectionTitle,
} from '@/shared/ui';

type DistributionDraft = {
  id: string | null;
  lecture_plan_id: string;
  assessment_type: AssessmentType;
  percentage: string;
  total_assessment: string;
  display_order: string;
};

type AssessmentDraft = {
  id: string | null;
  assessment_distribution_id: string;
  title: string;
  sequence_no: string;
  max_mark: string;
  assessment_date: string;
  due_at: string;
};

const STATUS_TONE: Record<AssessmentStatus, 'info' | 'success' | 'neutral' | 'danger'> = {
  SCHEDULED: 'neutral',
  OPEN: 'info',
  CLOSED: 'danger',
  GRADED: 'success',
};

export function PlanDetailScreen() {
  const params = useLocalSearchParams<{ planId?: string }>();
  const planId = String(params.planId ?? '');
  const { user } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);
  const actions = useSubmit();

  const plan = useResource<LecturePlan>(() => teachingApi.plans.get(planId), [planId]);
  const distributions = usePaged(
    (page) => teachingApi.distributions.list(planId, page),
    [planId],
  );
  const assessments = usePaged<Assessment>(
    (page) => teachingApi.assessments.list({ lecture_plan_id: planId, page, page_size: 100 }),
    [planId],
  );

  const data = plan.data;
  const canWrite = data !== null && (user?.role === 'ADMIN' || data.lecturer_id === user?.id);
  const draftPlan = data?.status === 'DRAFT';
  const basePath = user?.role === 'ADMIN' ? '/admin/assessments' : '/teacher/assessments';

  const refreshAll = () => {
    plan.reload();
    distributions.reload();
    assessments.reload();
  };

  const distributionForm = useEntityForm<DistributionDraft>({
    blank: {
      id: null,
      lecture_plan_id: planId,
      assessment_type: 'QUIZ',
      percentage: '',
      total_assessment: '1',
      display_order: String(distributions.count + 1),
    },
    validate: (value) => {
      const percentage = Number(value.percentage);
      const total = Number(value.total_assessment);
      const order = Number(value.display_order);
      return {
        percentage:
          Number.isInteger(percentage) && percentage >= 1 && percentage <= 100 ? null : 'A whole number from 1 to 100.',
        total_assessment: Number.isInteger(total) && total >= 1 ? null : 'At least one assessment.',
        display_order: Number.isInteger(order) && order >= 1 ? null : 'Position starts at 1.',
      };
    },
    save: (value) => {
      const body = {
        lecture_plan_id: value.lecture_plan_id,
        assessment_type: value.assessment_type,
        percentage: Number(value.percentage),
        total_assessment: Number(value.total_assessment),
        display_order: Number(value.display_order),
      };
      return value.id === null
        ? teachingApi.distributions.create(body)
        : teachingApi.distributions.update(value.id, body);
    },
    remove: (id) => teachingApi.distributions.remove(id),
    onSaved: refreshAll,
  });

  const assessmentForm = useEntityForm<AssessmentDraft>({
    blank: {
      id: null,
      assessment_distribution_id: '',
      title: '',
      sequence_no: '1',
      max_mark: '',
      assessment_date: '',
      due_at: '',
    },
    validate: (value) => {
      const max = Number(value.max_mark);
      const sequence = Number(value.sequence_no);
      return {
        title: value.title.trim() === '' ? 'A title is required.' : null,
        sequence_no: Number.isInteger(sequence) && sequence >= 1 ? null : 'Sequence starts at 1.',
        max_mark: max > 0 ? null : 'Maximum mark must be greater than 0.',
        assessment_date: value.assessment_date === '' || isDateOnly(value.assessment_date) ? null : 'Use YYYY-MM-DD.',
        due_at: value.due_at === '' || !Number.isNaN(Date.parse(value.due_at)) ? null : 'Use 2027-01-12T10:30:00Z.',
      };
    },
    save: (value) => {
      const body = {
        title: value.title,
        sequence_no: Number(value.sequence_no),
        max_mark: value.max_mark,
        assessment_date: value.assessment_date === '' ? null : value.assessment_date,
        due_at: value.due_at === '' ? null : value.due_at,
      };
      if (value.id === null) {
        return teachingApi.assessments.create({
          ...body,
          assessment_distribution_id: value.assessment_distribution_id,
        });
      }
      return teachingApi.assessments.update(value.id, body);
    },
    remove: (id) => teachingApi.assessments.remove(id),
    onSaved: refreshAll,
  });

  const noteForm = useSubmit();
  const [note, setNote] = useState<string | null>(null);

  const runAction = async (label: string | ((result: unknown) => string), task: () => Promise<unknown>) => {
    setNotice(null);
    const ok = await actions.run(task, label);
    if (ok) refreshAll();
  };

  if (plan.loading && data === null) return <Screen><LoadingBlock label="Loading lecture plan…" /></Screen>;

  if (data === null) {
    return (
      <Screen scroll>
        <AppHeader title="Lecture plan" back />
        <ErrorBanner title="Could not load this plan" messages={plan.error ?? ['No data returned.']} />
        <Button label="Try again" variant="secondary" onPress={plan.reload} />
      </Screen>
    );
  }

  const distributionOptions = distributions.items.map((item) => ({
    value: item.id,
    label: `${item.assessment_type} (${item.percentage}%)`,
  }));
  const published = data.status === 'PUBLISHED';

  return (
    <Screen scroll width="content">
      <AppHeader
        title={data.module.module_code}
        subtitle={`${data.module.module_name} · ${data.module.credit_hours} credit hours`}
        back
        actions={<Badge label={data.status} tone={published ? 'success' : 'neutral'} />}
      />

      {actions.error !== null ? <ErrorBanner title="The API refused this action" messages={actions.error} /> : null}
      {notice !== null ? <Body tone="success">{notice}</Body> : null}
      {plan.error !== null ? <ErrorBanner title="Plan refresh failed" messages={plan.error} /> : null}

      <Card title="Plan">
        <Body>{`Lecturer: ${data.lecturer.full_name}`}</Body>
        <Body tone="muted">{`Academic year ${data.academic_year} · weighted ${data.percentage_total}% of 100%`}</Body>
        <Field
          label="Note"
          value={note ?? data.note}
          multiline
          numberOfLines={3}
          editable={canWrite}
          onChangeText={setNote}
          placeholder="How the module is assessed."
        />
        {canWrite && note !== null && note !== data.note ? (
          <Button
            label="Save note"
            variant="secondary"
            loading={noteForm.pending}
            onPress={async () => {
              const ok = await noteForm.run(() => teachingApi.plans.update(data.id, { note }), 'Note saved.');
              if (ok) {
                setNote(null);
                plan.reload();
              }
            }}
          />
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {canWrite && !published ? (
            <>
              <Button
                label="Publish plan"
                loading={actions.pending}
                onPress={() => runAction('Plan published.', () => teachingApi.plans.publish(data.id))}
              />
              <Button
                label="Delete plan"
                variant="secondary"
                disabled={actions.pending}
                onPress={() => runAction('Plan deleted.', () => teachingApi.plans.remove(data.id))}
              />
            </>
          ) : null}
          {canWrite && published ? (
            <Button
              label="Revert to draft"
              variant="secondary"
              loading={actions.pending}
              onPress={() => runAction('Plan is DRAFT again.', () => teachingApi.plans.revert(data.id))}
            />
          ) : null}
        </View>
        {canWrite && !published ? (
          <Body tone="muted">
            Publish needs at least one distribution, percentages that total 100, matching assessment counts, sequences
            from 1, and a title plus a maximum mark above 0 on every item.
          </Body>
        ) : null}
      </Card>

      <View style={{ gap: 10 }}>
        <SectionTitle>Assessment weighting</SectionTitle>
        {canWrite && draftPlan ? (
          <Button label="Add distribution" onPress={() => distributionForm.open()} />
        ) : null}
      </View>

      <ResourceList
        items={distributions.items}
        loading={distributions.loading}
        error={distributions.error}
        emptyMessage="No distributions yet."
        onRetry={distributions.reload}
        grid={false}
        renderItem={(distribution) => {
          const rows = assessments.items
            .filter((item) => item.assessment_distribution_id === distribution.id)
            .sort((left, right) => left.sequence_no - right.sequence_no);

          return (
            <Card
              title={`${distribution.assessment_type} · ${distribution.percentage}%`}
              actions={
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <Badge
                    label={distribution.status}
                    tone={distribution.status === 'COMPLETED' ? 'success' : 'neutral'}
                  />
                  <Badge
                    label={`${distribution.assessment_count}/${distribution.total_assessment}`}
                    tone={distribution.assessment_count === distribution.total_assessment ? 'success' : 'danger'}
                  />
                  {canWrite && draftPlan ? (
                    <>
                      <Button
                        label="Edit"
                        variant="secondary"
                        onPress={() =>
                          distributionForm.open({
                            id: distribution.id,
                            lecture_plan_id: distribution.lecture_plan_id,
                            assessment_type: distribution.assessment_type,
                            percentage: String(distribution.percentage),
                            total_assessment: String(distribution.total_assessment),
                            display_order: String(distribution.display_order),
                          })
                        }
                      />
                      <Button
                        label="Remove"
                        variant="secondary"
                        onPress={() =>
                          runAction('Distribution removed.', () => teachingApi.distributions.remove(distribution.id))
                        }
                      />
                    </>
                  ) : null}
                </View>
              }
            >
              <Body tone="muted">{`Position ${distribution.display_order}`}</Body>
              {rows.length === 0 ? (
                <Body tone="faint">No assessments in this group yet.</Body>
              ) : (
                rows.map((assessment) => (
                  <RecordRow
                    key={assessment.id}
                    title={`${assessment.sequence_no}. ${assessment.title}`}
                    subtitle={`Max ${assessment.max_mark}${assessment.assessment_date ? ` · ${assessment.assessment_date}` : ''}`}
                    badge={<Badge label={assessment.status} tone={STATUS_TONE[assessment.status]} />}
                    trailing={
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {canWrite ? (
                          <>
                            {assessment.status === 'SCHEDULED' && published ? (
                              <Button
                                label="Open"
                                variant="secondary"
                                onPress={() =>
                                  runAction(`${assessment.title} is OPEN.`, () => teachingApi.assessments.open(assessment.id))
                                }
                              />
                            ) : null}
                            {assessment.status === 'OPEN' ? (
                              <Button
                                label="Close"
                                variant="secondary"
                                onPress={() =>
                                  runAction(`${assessment.title} is CLOSED.`, () => teachingApi.assessments.close(assessment.id))
                                }
                              />
                            ) : null}
                            {(assessment.status === 'OPEN' || assessment.status === 'CLOSED') && published ? (
                              <Button
                                label="Mark graded"
                                onPress={() =>
                                  runAction(
                                    (result) =>
                                      (result as Assessment).run_finished === true
                                        ? `${assessment.title} graded — this module's run is finished.`
                                        : `${assessment.title} is GRADED.`,
                                    () => teachingApi.assessments.markGraded(assessment.id),
                                  )
                                }
                              />
                            ) : null}
                            <Button
                              label="Marks"
                              variant="secondary"
                              onPress={() => router.push(`${basePath}/${assessment.id}` as Href)}
                            />
                            {draftPlan ? (
                              <Button
                                label="Edit"
                                variant="secondary"
                                onPress={() =>
                                  assessmentForm.open({
                                    id: assessment.id,
                                    assessment_distribution_id: assessment.assessment_distribution_id,
                                    title: assessment.title,
                                    sequence_no: String(assessment.sequence_no),
                                    max_mark: assessment.max_mark,
                                    assessment_date: assessment.assessment_date ?? '',
                                    due_at: assessment.due_at ?? '',
                                  })
                                }
                              />
                            ) : null}
                          </>
                        ) : null}
                      </View>
                    }
                  />
                ))
              )}
              {canWrite && draftPlan ? (
                <Button
                  label="Add assessment"
                  variant="secondary"
                  onPress={() =>
                    assessmentForm.open({
                      id: null,
                      assessment_distribution_id: distribution.id,
                      title: '',
                      sequence_no: String(rows.length + 1),
                      max_mark: '',
                      assessment_date: '',
                      due_at: '',
                    })
                  }
                />
              ) : null}
            </Card>
          );
        }}
      />

      <FormSheet
        title={distributionForm.draft?.id === null || distributionForm.draft === undefined ? 'Add distribution' : 'Edit distribution'}
        form={distributionForm}
        hint="Type and position are unique inside the plan. After publish these values freeze and writes return 409."
      >
        {(value, update) => (
          <>
            <OptionChips<AssessmentType>
              label="Assessment type"
              options={ASSESSMENT_TYPES.map((type) => ({ value: type, label: type }))}
              value={value.assessment_type}
              onChange={(assessment_type) => update({ assessment_type })}
            />
            <FieldRow>
              <Field
                label="Weight %"
                value={value.percentage}
                keyboardType="number-pad"
                error={distributionForm.problems.percentage}
                onChangeText={(percentage) => update({ percentage })}
              />
              <Field
                label="Number of assessments"
                value={value.total_assessment}
                keyboardType="number-pad"
                error={distributionForm.problems.total_assessment}
                onChangeText={(total_assessment) => update({ total_assessment })}
              />
            </FieldRow>
            <Field
              label="Display order"
              value={value.display_order}
              keyboardType="number-pad"
              error={distributionForm.problems.display_order}
              onChangeText={(display_order) => update({ display_order })}
            />
          </>
        )}
      </FormSheet>

      <FormSheet
        title={assessmentForm.draft?.id === null || assessmentForm.draft === undefined ? 'Add assessment' : 'Edit assessment'}
        form={assessmentForm}
        hint={
          published
            ? 'The plan is published: max mark, sequence and the parent group are frozen, and marks already recorded freeze the rest.'
            : 'Sequence is unique inside the group and must run 1…total.'
        }
      >
        {(value, update) => (
          <>
            {value.id === null ? (
              <Picker
                label="Distribution"
                options={distributionOptions}
                value={value.assessment_distribution_id}
                onChange={(assessment_distribution_id) => update({ assessment_distribution_id })}
              />
            ) : null}
            <Field
              label="Title"
              value={value.title}
              placeholder="Quiz 1"
              error={assessmentForm.problems.title}
              onChangeText={(title) => update({ title })}
            />
            <FieldRow>
              <Field
                label="Sequence"
                value={value.sequence_no}
                keyboardType="number-pad"
                error={assessmentForm.problems.sequence_no}
                onChangeText={(sequence_no) => update({ sequence_no })}
              />
              <Field
                label="Maximum mark"
                value={value.max_mark}
                keyboardType="decimal-pad"
                error={assessmentForm.problems.max_mark}
                onChangeText={(max_mark) => update({ max_mark })}
              />
            </FieldRow>
            <FieldRow>
              <Field
                label="Assessment date"
                value={value.assessment_date}
                placeholder="2027-01-12"
                error={assessmentForm.problems.assessment_date}
                onChangeText={(assessment_date) => update({ assessment_date })}
              />
              <Field
                label="Due at"
                value={value.due_at}
                autoCapitalize="none"
                placeholder="2027-01-12T10:30:00Z"
                error={assessmentForm.problems.due_at}
                onChangeText={(due_at) => update({ due_at })}
              />
            </FieldRow>
          </>
        )}
      </FormSheet>
    </Screen>
  );
}
