import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { catalogApi, type Module, type TeachingPeriod } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { usersApi, type User } from '@/features/users/api';
import { teachingApi, type LecturePlan, type PlanStatus } from '@/features/teaching/api';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import {
  Badge,
  Body,
  Button,
  Field,
  OptionChips,
  Pager,
  Picker,
  RecordRow,
  ResponsiveDataView,
  Screen,
  Sheet,
} from '@/shared/ui';

type Draft = { id: string | null; module_id: string; lecturer_id: string; note: string };

interface PlansScreenProps {
  /** `mine` reads /api/me/lecture-plans/, `all` reads /api/lecture-plans/. */
  scope: 'mine' | 'all';
  /** Students see the published plans of their modules without any write affordances. */
  readOnly?: boolean;
}

export function PlansScreen({ scope, readOnly = false }: PlansScreenProps) {
  const { user } = useAuth();
  const role = user?.role ?? 'STUDENT';
  const [status, setStatus] = useState<'ALL' | PlanStatus>('ALL');
  const [pickedPeriod, setPickedPeriod] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const periods = usePaged<TeachingPeriod>((page) => catalogApi.teachingPeriods.list({ page, page_size: 100 }), []);
  const periodId = pickedPeriod ?? periods.items.find((item) => item.status === 'ACTIVE')?.id ?? periods.items[0]?.id ?? '';
  const periodOptions = periods.items.map((item) => ({ value: item.id, label: `${item.academic_label} · ${item.name}` }));

  const list = usePaged<LecturePlan>(
    (page) => {
      const params = {
        page,
        status: status === 'ALL' ? undefined : status,
        semester_id: periodId || undefined,
      };
      return scope === 'mine' ? teachingApi.plans.mine(params) : teachingApi.plans.list(params);
    },
    [status, periodId, scope],
  );

  const basePath = role === 'ADMIN' ? '/admin/plans' : role === 'TEACHER' ? '/teacher/plans' : '/student/plans';
  const canAssign = role === 'ADMIN';
  /** Offering a module — creating its plan with a named teacher — is an admin action. */
  const canOffer = role === 'ADMIN' && !readOnly;

  const modules = usePaged<Module>(
    (page) =>
      canOffer
        ? catalogApi.modules.list({ page, page_size: 100, semester_id: periodId || undefined, planned: 'false' })
        : Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
    [canOffer, periodId],
  );
  const moduleOptions = modules.items.map((item) => ({
    value: item.id,
    label: `${item.module_code} — ${item.module_name} · Year ${item.study_year} · ${item.academic_year}`,
  }));

  const lecturers = usePaged<User>(
    (page) =>
      canAssign
        ? usersApi.list({ page, page_size: 100, role: 'TEACHER' })
        : Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
    [canAssign],
  );
  const lecturerOptions = lecturers.items.map((item) => ({ value: item.id, label: item.full_name || item.username }));

  const form = useEntityForm<Draft>({
    blank: { id: null, module_id: '', lecturer_id: '', note: '' },
    validate: (draft) => ({
      module_id: draft.module_id === '' ? 'Choose the module to offer.' : null,
      lecturer_id: draft.lecturer_id === '' ? 'Choose the teacher who will own it.' : null,
    }),
    save: (draft) => {
      if (draft.id === null) {
        return teachingApi.plans.create({
          module_id: draft.module_id,
          lecturer_id: draft.lecturer_id,
          note: draft.note,
        });
      }
      return teachingApi.plans.update(draft.id, canAssign ? { note: draft.note, lecturer_id: draft.lecturer_id } : { note: draft.note });
    },
    remove: (id) => teachingApi.plans.remove(id),
    onSaved: () => list.reload(),
  });

  return (
    <Screen scroll width="content">
      <AppHeader
        title={scope === 'mine' ? 'My assigned modules' : 'Module assignments'}
        subtitle={
          scope === 'mine'
            ? 'Current and historical teaching assignments. Configure the assessment count before entering marks.'
            : 'Assign each module offering in a teaching period to its responsible teacher.'
        }
        actions={<><Button label={status !== 'ALL' || pickedPeriod ? 'Filter (active)' : 'Filter'} variant="secondary" onPress={() => setFiltersOpen(true)} />{canOffer ? <Button label="Assign module" onPress={() => form.open()} /> : null}</>}
      />

      <Sheet title="Filter module assignments" visible={filtersOpen} onDismiss={() => setFiltersOpen(false)}>
        <View style={{ gap: 14 }}>
          <OptionChips<'ALL' | PlanStatus>
            label="Status"
            value={status}
            onChange={(next) => {
              setStatus(next);
              list.setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
            ]}
          />
          <Picker
            label="Teaching period"
            loading={periods.loading}
            options={periodOptions}
            value={periodId}
            onChange={(value) => {
              setPickedPeriod(value);
              list.setPage(1);
            }}
          />
          <Button label="Show results" onPress={() => setFiltersOpen(false)} />
        </View>
      </Sheet>

      <ResponsiveDataView
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage={scope === 'mine' ? 'No module has been offered to you in this teaching period yet.' : 'No lecture plans match these filters.'}
        onRetry={list.reload}
        keyExtractor={(plan) => plan.id}
        onRowPress={(plan) => router.push(`${basePath}/${plan.id}` as Href)}
        columns={[
          { key: 'code', label: 'Code', minWidth: 90, flex: 0.7, render: (plan) => <Body>{plan.module.module_code}</Body> },
          { key: 'module', label: 'Module', minWidth: 180, flex: 1.5, render: (plan) => <Body>{plan.module.module_name}</Body> },
          { key: 'year', label: 'Study year', minWidth: 90, flex: 0.7, render: (plan) => <Body tone="secondary">Year {plan.module.study_year}</Body> },
          { key: 'teacher', label: 'Teacher', minWidth: 160, flex: 1.2, render: (plan) => <Body tone="secondary">{plan.lecturer.full_name}</Body> },
          { key: 'semester', label: 'Semester', minWidth: 150, render: (plan) => <Body tone="secondary">{plan.semester.semester_name}</Body> },
          { key: 'assessments', label: 'Assessments', minWidth: 100, flex: 0.8, render: (plan) => <Body tone="secondary">{plan.assessment_total}</Body> },
          { key: 'status', label: 'Status', minWidth: 100, flex: 0.8, render: (plan) => <Badge label={plan.status} tone={plan.status === 'PUBLISHED' ? 'success' : 'neutral'} /> },
        ]}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        renderCard={(plan) => (
          <RecordRow
            title={`${plan.module.module_code} — ${plan.module.module_name}`}
            subtitle={`${plan.lecturer.full_name} · ${plan.semester.semester_name} · ${plan.academic_year}`}
            badge={
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Badge label={plan.status} tone={plan.status === 'PUBLISHED' ? 'success' : 'neutral'} />
                <Badge
                  label={`${plan.assessment_total} assessments · ${plan.total_marks} marks`}
                  tone={plan.assessment_total === 0 ? 'danger' : 'neutral'}
                />
              </View>
            }
            onPress={() => router.push(`${basePath}/${plan.id}` as Href)}
          />
        )}
      />

      <FormSheet
        title={form.draft?.id === null || form.draft === undefined ? 'Assign module' : 'Module assignment'}
        form={form}
        hint="Only modules in an active teaching period that have no teacher yet are available. The teacher starts in Draft and writes the raw assessment marks."
      >
        {(draft, update) => (
          <>
            {draft.id === null ? (
              <Picker label="Module" loading={modules.loading} options={moduleOptions} value={draft.module_id} onChange={(module_id) => update({ module_id })} />
            ) : (
              <Body tone="muted">The module of a plan never changes.</Body>
            )}
            {canAssign ? (
              <Picker
                label="Teacher"
                loading={lecturers.loading}
                options={lecturerOptions}
                value={draft.lecturer_id}
                onChange={(lecturer_id) => update({ lecturer_id })}
              />
            ) : null}
            <Field
              label="Note"
              value={draft.note}
              multiline
              numberOfLines={3}
              placeholder="Weekly quiz, one midterm, one final."
              onChangeText={(note) => update({ note })}
            />
          </>
        )}
      </FormSheet>
    </Screen>
  );
}
