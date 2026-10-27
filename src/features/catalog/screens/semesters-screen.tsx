import { useMemo, useState } from 'react';

import { catalogApi, type Academic, type Semester } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { ResourceList } from '@/features/shell/components/resource-list';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import { isDateOnly } from '@/shared/utils/format';
import { Badge, Button, Field, FieldRow, Pager, Picker, RecordRow, Screen } from '@/shared/ui';
import { Card } from '@/shared/ui/card';

type Draft = Omit<Semester, 'id' | 'academic_year'> & { id: string | null };

export function SemestersScreen() {
  const [picked, setPicked] = useState<string | null>(null);
  const academics = usePaged<Academic>((page) => catalogApi.academics.list({ page, page_size: 100 }), []);
  const academicId = picked ?? academics.items[0]?.id ?? '';
  const academicOptions = useMemo(
    () => academics.items.map((item) => ({ value: item.id, label: item.academic_year })),
    [academics.items],
  );

  const list = usePaged<Semester>(
    (page) => catalogApi.semesters.list({ page, page_size: 100, academic_id: academicId || undefined }),
    [academicId],
  );

  const form = useEntityForm<Draft>({
    blank: { id: null, academic_id: academicId, semester_no: 1, semester_name: '', start_date: '', end_date: '' },
    validate: (draft) => ({
      semester_name: draft.semester_name.trim() === '' ? 'Required, for example First Semester.' : null,
      semester_no: draft.semester_no >= 1 ? null : 'Semester number starts at 1.',
      start_date: isDateOnly(draft.start_date) ? null : 'Use YYYY-MM-DD.',
      end_date: isDateOnly(draft.end_date) ? null : 'Use YYYY-MM-DD.',
    }),
    save: (draft) => {
      const body = {
        academic_id: draft.academic_id,
        semester_no: draft.semester_no,
        semester_name: draft.semester_name,
        start_date: draft.start_date,
        end_date: draft.end_date,
      };
      return draft.id === null ? catalogApi.semesters.create(body) : catalogApi.semesters.update(draft.id, body);
    },
    remove: (id) => catalogApi.semesters.remove(id),
    onSaved: () => list.reload(),
  });

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Semesters"
        subtitle="Dates must fall inside the academic year."
        actions={<Button label="New semester" onPress={() => form.open()} />}
      />

      <Card title="Academic year">
        <Picker
          label="Show semesters of"
          loading={academics.loading}
          options={academicOptions}
          value={academicId}
          onChange={(value) => {
            setPicked(value);
            list.setPage(1);
          }}
        />
      </Card>

      <ResourceList
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No semesters for this academic year."
        onRetry={list.reload}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        renderItem={(semester) => (
          <RecordRow
            title={`${semester.semester_no}. ${semester.semester_name}`}
            subtitle={`${semester.start_date} → ${semester.end_date}`}
            badge={<Badge label={semester.academic_year} tone="neutral" />}
            onPress={() => form.open({ ...semester })}
          />
        )}
      />

      <FormSheet
        title={form.draft?.id === null || form.draft === undefined ? 'New semester' : 'Edit semester'}
        form={form}
        hint="Unique per academic year. Deleting needs no modules attached."
      >
        {(draft, update) => (
          <>
            <Picker
              label="Academic year"
              options={academicOptions}
              value={draft.academic_id}
              onChange={(academic_id) => update({ academic_id })}
            />
            <FieldRow>
              <Field
                label="Semester number"
                value={String(draft.semester_no)}
                keyboardType="number-pad"
                error={form.problems.semester_no}
                onChangeText={(text) => update({ semester_no: Number(text) || 0 })}
              />
              <Field
                label="Semester name"
                value={draft.semester_name}
                placeholder="First Semester"
                error={form.problems.semester_name}
                onChangeText={(semester_name) => update({ semester_name })}
              />
            </FieldRow>
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
                placeholder="2027-03-31"
                error={form.problems.end_date}
                onChangeText={(end_date) => update({ end_date })}
              />
            </FieldRow>
          </>
        )}
      </FormSheet>
    </Screen>
  );
}
