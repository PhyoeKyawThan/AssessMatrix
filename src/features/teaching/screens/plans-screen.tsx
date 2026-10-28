import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { catalogApi, type Academic, type Module } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { ResourceList } from '@/features/shell/components/resource-list';
import { usersApi, type User } from '@/features/users/api';
import { teachingApi, type LecturePlan, type PlanStatus } from '@/features/teaching/api';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import { useResponsive } from '@/shared/theme';
import {
  Badge,
  Body,
  Button,
  Card,
  Field,
  OptionChips,
  Pager,
  Picker,
  RecordRow,
  Screen,
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
  const layout = useResponsive();
  const role = user?.role ?? 'STUDENT';
  const [status, setStatus] = useState<'ALL' | PlanStatus>('ALL');
  const [pickedAcademic, setPickedAcademic] = useState<string | null>(null);

  const academics = usePaged<Academic>((page) => catalogApi.academics.list({ page, page_size: 100 }), []);
  const academicId = pickedAcademic ?? academics.items[0]?.id ?? '';
  const academicOptions = academics.items.map((item) => ({ value: item.id, label: item.academic_year }));

  const list = usePaged<LecturePlan>(
    (page) => {
      const params = {
        page,
        status: status === 'ALL' ? undefined : status,
        academic_id: academicId || undefined,
      };
      return scope === 'mine' ? teachingApi.plans.mine(params) : teachingApi.plans.list(params);
    },
    [status, academicId, scope],
  );

  const basePath = role === 'ADMIN' ? '/admin/plans' : role === 'TEACHER' ? '/teacher/plans' : '/student/plans';
  const canAssign = role === 'ADMIN';
  /** Offering a module — creating its plan with a named teacher — is an admin action. */
  const canOffer = role === 'ADMIN' && !readOnly;

  const modules = usePaged<Module>(
    (page) =>
      canOffer
        ? catalogApi.modules.list({ page, page_size: 100, current_year: 'true', planned: 'false' })
        : Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
    [canOffer],
  );
  const moduleOptions = modules.items.map((item) => ({
    value: item.id,
    label: `${item.module_code} — ${item.module_name} · ${item.academic_year}`,
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
        title={scope === 'mine' ? 'My lecture plans' : 'Lecture plans'}
        subtitle={
          scope === 'mine'
            ? 'A plan in Draft means the semester scheme is still yours to write. Marks are raw — no weighting.'
            : 'Admins offer a module of the current academic year to one teacher. Everything else follows from that.'
        }
        actions={canOffer ? <Button label="Offer a module" onPress={() => form.open()} /> : null}
      />

      <Card title="Filters">
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
            label="Academic year"
            loading={academics.loading}
            options={academicOptions}
            value={academicId}
            onChange={(value) => {
              setPickedAcademic(value);
              list.setPage(1);
            }}
          />
        </View>
      </Card>

      <ResourceList
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage={scope === 'mine' ? 'No module has been offered to you in this academic year yet.' : 'No lecture plans match these filters.'}
        onRetry={list.reload}
        grid={layout.detailColumns === 2}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        renderItem={(plan) => (
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
        title={form.draft?.id === null || form.draft === undefined ? 'Offer a module' : 'Lecture plan'}
        form={form}
        hint="Only the current academic year is offered, and only modules nobody has been given yet. The teacher starts in Draft and writes the raw assessment marks themselves."
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
