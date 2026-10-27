import { useState } from 'react';

import { catalogApi, type Academic } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { ResourceList } from '@/features/shell/components/resource-list';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import { isDateOnly } from '@/shared/utils/format';
import {
  Badge,
  Field,
  FieldRow,
  OptionChips,
  Pager,
  RecordRow,
  Screen,
} from '@/shared/ui';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

type CurrentFilter = 'ALL' | 'true' | 'false';
type Draft = Omit<Academic, 'id'> & { id: string | null };

const BLANK: Draft = { id: null, academic_year: '', start_date: '', end_date: '', is_current: false };

export function AcademicsScreen() {
  const [filter, setFilter] = useState<CurrentFilter>('ALL');
  const list = usePaged<Academic>(
    (page) => catalogApi.academics.list({ page, is_current: filter === 'ALL' ? undefined : filter }),
    [filter],
  );

  const form = useEntityForm<Draft>({
    blank: BLANK,
    validate: (draft) => ({
      academic_year: draft.academic_year.trim() === '' ? 'Required, for example 2026-2027.' : null,
      start_date: isDateOnly(draft.start_date) ? null : 'Use YYYY-MM-DD.',
      end_date: isDateOnly(draft.end_date) ? null : 'Use YYYY-MM-DD.',
    }),
    save: (draft) => {
      const body = {
        academic_year: draft.academic_year,
        start_date: draft.start_date,
        end_date: draft.end_date,
        is_current: draft.is_current,
      };
      return draft.id === null ? catalogApi.academics.create(body) : catalogApi.academics.update(draft.id, body);
    },
    remove: (id) => catalogApi.academics.remove(id),
    onSaved: () => list.reload(),
  });

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Academic years"
        subtitle="One year is current. Semesters and modules sit inside a year."
        actions={<Button label="New year" onPress={() => form.open()} />}
      />

      <Card title="Filter">
        <OptionChips<CurrentFilter>
          value={filter}
          onChange={(next) => {
            setFilter(next);
            list.setPage(1);
          }}
          options={[
            { value: 'ALL', label: 'All years' },
            { value: 'true', label: 'Current only' },
            { value: 'false', label: 'Past only' },
          ]}
        />
      </Card>

      <ResourceList
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No academic years yet."
        onRetry={list.reload}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        renderItem={(academic) => (
          <RecordRow
            title={academic.academic_year}
            subtitle={`${academic.start_date} → ${academic.end_date}`}
            badge={<Badge label={academic.is_current ? 'Current' : 'Archived'} tone={academic.is_current ? 'success' : 'neutral'} />}
            onPress={() => form.open({ ...academic })}
          />
        )}
      />

      <FormSheet
        title={form.draft?.id === null || form.draft === undefined ? 'New academic year' : 'Edit academic year'}
        form={form}
        hint="Making a year current clears the previous one. Delete needs no semesters or grade bands."
      >
        {(draft, update) => (
          <>
            <Field
              label="Academic year"
              value={draft.academic_year}
              placeholder="2026-2027"
              error={form.problems.academic_year}
              onChangeText={(academic_year) => update({ academic_year })}
            />
            <FieldRow>
              <Field
                label="Start date"
                value={draft.start_date}
                placeholder="2026-12-01"
                error={form.problems.start_date}
                onChangeText={(start_date) => update({ start_date })}
              />
              <Field
                label="End date"
                value={draft.end_date}
                placeholder="2027-09-30"
                error={form.problems.end_date}
                onChangeText={(end_date) => update({ end_date })}
              />
            </FieldRow>
            <OptionChips<'true' | 'false'>
              label="Currency"
              value={draft.is_current ? 'true' : 'false'}
              onChange={(next) => update({ is_current: next === 'true' })}
              options={[
                { value: 'true', label: 'Current' },
                { value: 'false', label: 'Not current' },
              ]}
            />
          </>
        )}
      </FormSheet>
    </Screen>
  );
}
