import { useState } from 'react';

import { catalogApi, type TeachingPeriod, type TeachingPeriodStatus } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import { isDateOnly } from '@/shared/utils/format';
import {
  Badge, Body, Button, DateField, Field, FieldRow, OptionChips, Pager,
  RecordRow, ResponsiveDataView, Screen, Sheet,
} from '@/shared/ui';

type StatusFilter = 'ALL' | TeachingPeriodStatus;
type Draft = Omit<TeachingPeriod, 'id'> & { id: string | null };

const BLANK: Draft = {
  id: null, academic_label: '', period_number: 1, name: 'First teaching period',
  start_date: '', end_date: '', status: 'DRAFT',
};

const statusTone = (status: TeachingPeriodStatus) => (
  status === 'ACTIVE' ? 'success' : status === 'DRAFT' ? 'info' : 'neutral'
);

export function AcademicsScreen() {
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const list = usePaged<TeachingPeriod>(
    (page) => catalogApi.teachingPeriods.list({
      page, page_size: 100, status: filter === 'ALL' ? undefined : filter,
    }),
    [filter],
  );

  const form = useEntityForm<Draft>({
    blank: BLANK,
    validate: (draft) => ({
      academic_label: draft.academic_label.trim() ? null : 'Required, for example 2026–2027.',
      name: draft.name.trim() ? null : 'Required.',
      start_date: isDateOnly(draft.start_date) ? null : 'Choose a start date.',
      end_date: isDateOnly(draft.end_date) ? null : 'Choose an end date.',
    }),
    save: ({ id, ...body }) => (
      id === null ? catalogApi.teachingPeriods.create(body) : catalogApi.teachingPeriods.update(id, body)
    ),
    remove: catalogApi.teachingPeriods.remove,
    onSaved: list.reload,
  });

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Teaching periods"
        subtitle="Schedule dated periods here. Fixed Semester 1–10 structures and their modules are managed in Curriculum."
        actions={(
          <>
            <Button label={filter === 'ALL' ? 'Filter' : 'Filter (active)'} variant="secondary" onPress={() => setFiltersOpen(true)} />
            <Button label="New teaching period" onPress={() => form.open()} />
          </>
        )}
      />

      <Sheet title="Filter teaching periods" visible={filtersOpen} onDismiss={() => setFiltersOpen(false)}>
        <OptionChips<StatusFilter>
          label="Status"
          value={filter}
          onChange={(value) => { setFilter(value); list.setPage(1); }}
          options={[
            { value: 'ALL', label: 'All' }, { value: 'DRAFT', label: 'Draft' },
            { value: 'ACTIVE', label: 'Active' }, { value: 'CLOSED', label: 'Closed' },
            { value: 'ARCHIVED', label: 'Archived' },
          ]}
        />
        <Button label="Show results" onPress={() => setFiltersOpen(false)} />
      </Sheet>

      <ResponsiveDataView
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No teaching periods yet."
        onRetry={list.reload}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        keyExtractor={(period) => period.id}
        onRowPress={(period) => form.open({ ...period })}
        columns={[
          { key: 'label', label: 'Academic label', minWidth: 140, render: (period) => <Body>{period.academic_label}</Body> },
          { key: 'period', label: 'Teaching period', minWidth: 210, flex: 1.4, render: (period) => <Body>{period.name}</Body> },
          { key: 'dates', label: 'Dates', minWidth: 220, render: (period) => <Body tone="secondary">{period.start_date} → {period.end_date}</Body> },
          { key: 'status', label: 'Status', minWidth: 100, render: (period) => <Badge label={period.status} tone={statusTone(period.status)} /> },
        ]}
        renderCard={(period) => (
          <RecordRow
            title={`${period.academic_label} · ${period.name}`}
            subtitle={`${period.start_date} → ${period.end_date}`}
            badge={<Badge label={period.status} tone={statusTone(period.status)} />}
            onPress={() => form.open({ ...period })}
          />
        )}
      />

      <FormSheet
        title={form.draft?.id ? 'Edit teaching period' : 'New teaching period'}
        form={form}
        hint="The academic label groups reports only. Multiple teaching periods may be active during a transition."
        deleteConfirmation={form.draft?.id && form.draft.status === 'DRAFT' ? {
          value: form.draft.name, description: 'Delete this draft teaching period?',
        } : undefined}
      >
        {(draft, update) => (
          <>
            <Field label="Academic label" placeholder="2026–2027" value={draft.academic_label} error={form.problems.academic_label} onChangeText={(academic_label) => update({ academic_label })} />
            <OptionChips<'1' | '2'>
              label="Period in the academic label"
              value={String(draft.period_number) as '1' | '2'}
              onChange={(value) => update({
                period_number: Number(value) as 1 | 2,
                name: value === '1' ? 'First teaching period' : 'Second teaching period',
              })}
              options={[{ value: '1', label: 'Period 1' }, { value: '2', label: 'Period 2' }]}
            />
            <Field label="Display name" value={draft.name} error={form.problems.name} onChangeText={(name) => update({ name })} />
            <FieldRow>
              <DateField label="Start date" value={draft.start_date} error={form.problems.start_date} onChange={(start_date) => update({ start_date })} />
              <DateField label="End date" value={draft.end_date} minimumDate={draft.start_date || undefined} error={form.problems.end_date} onChange={(end_date) => update({ end_date })} />
            </FieldRow>
            <OptionChips<TeachingPeriodStatus>
              label="Status"
              value={draft.status}
              onChange={(status) => update({ status })}
              options={[
                { value: 'DRAFT', label: 'Draft' }, { value: 'ACTIVE', label: 'Active' },
                { value: 'CLOSED', label: 'Closed' }, { value: 'ARCHIVED', label: 'Archived' },
              ]}
            />
          </>
        )}
      </FormSheet>
    </Screen>
  );
}
