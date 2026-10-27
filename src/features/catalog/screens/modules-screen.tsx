import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { catalogApi, type Academic, type Module, type Semester } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { ResourceList } from '@/features/shell/components/resource-list';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import {
  Badge,
  Button,
  Card,
  Field,
  FieldRow,
  Pager,
  Picker,
  RecordRow,
  Screen,
} from '@/shared/ui';

type Draft = Omit<Module, 'id' | 'academic_id' | 'academic_year'> & { id: string | null };

export function ModulesScreen() {
  const [pickedAcademic, setPickedAcademic] = useState<string | null>(null);
  const [pickedSemester, setPickedSemester] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const academics = usePaged<Academic>((page) => catalogApi.academics.list({ page, page_size: 100 }), []);
  const academicId = pickedAcademic ?? academics.items[0]?.id ?? '';

  const semesters = usePaged<Semester>(
    (page) => catalogApi.semesters.list({ page, page_size: 100, academic_id: academicId || undefined }),
    [academicId],
  );
  const semesterId = pickedSemester ?? semesters.items[0]?.id ?? '';

  const list = usePaged<Module>(
    (page) => catalogApi.modules.list({ page, semester_id: semesterId || undefined, search: search || undefined }),
    [semesterId, search],
  );

  const academicOptions = useMemo(
    () => academics.items.map((item) => ({ value: item.id, label: item.academic_year })),
    [academics.items],
  );
  const semesterOptions = useMemo(
    () => semesters.items.map((item) => ({ value: item.id, label: `${item.semester_no}. ${item.semester_name}` })),
    [semesters.items],
  );

  const form = useEntityForm<Draft>({
    blank: { id: null, semester_id: semesterId, module_code: '', module_name: '', credit_hours: 3 },
    validate: (draft) => ({
      module_code: draft.module_code.trim() === '' ? 'Required, for example CS101.' : null,
      module_name: draft.module_name.trim() === '' ? 'Required.' : null,
      credit_hours: draft.credit_hours >= 1 && draft.credit_hours <= 30 ? null : 'Credit hours run from 1 to 30.',
    }),
    save: (draft) => {
      const body = {
        semester_id: draft.semester_id,
        module_code: draft.module_code,
        module_name: draft.module_name,
        credit_hours: draft.credit_hours,
      };
      return draft.id === null ? catalogApi.modules.create(body) : catalogApi.modules.update(draft.id, body);
    },
    remove: (id) => catalogApi.modules.remove(id),
    onSaved: () => list.reload(),
  });

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Modules"
        subtitle="A module belongs to one semester; the code is unique inside it."
        actions={<Button label="New module" onPress={() => form.open()} />}
      />

      <Card title="Filters">
        <View style={{ gap: 14 }}>
          <Picker
            label="Academic year"
            loading={academics.loading}
            options={academicOptions}
            value={academicId}
            onChange={(value) => {
              setPickedAcademic(value);
              setPickedSemester(null);
              list.setPage(1);
            }}
          />
          <Picker
            label="Semester"
            loading={semesters.loading}
            options={semesterOptions}
            value={semesterId}
            onChange={(value) => {
              setPickedSemester(value);
              list.setPage(1);
            }}
          />
          <FieldRow>
            <Field
              label="Search"
              value={search}
              autoCapitalize="none"
              placeholder="Module code or name"
              onChangeText={setSearch}
              onSubmitEditing={() => list.setPage(1)}
            />
            <View style={{ justifyContent: 'flex-end' }}>
              <Button label="Apply" variant="secondary" onPress={() => list.setPage(1)} />
            </View>
          </FieldRow>
        </View>
      </Card>

      <ResourceList
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No modules in this semester."
        onRetry={list.reload}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        renderItem={(module) => (
          <RecordRow
            title={`${module.module_code} — ${module.module_name}`}
            subtitle={`${module.credit_hours} credit hours`}
            badge={<Badge label={module.academic_year} tone="neutral" />}
            onPress={() => form.open({ ...module })}
          />
        )}
      />

      <FormSheet
        title={form.draft?.id === null || form.draft === undefined ? 'New module' : 'Edit module'}
        form={form}
        hint="Deleting needs no lecture plan and no enrollment."
      >
        {(draft, update) => (
          <>
            <Picker
              label="Semester"
              options={semesterOptions}
              value={draft.semester_id}
              onChange={(semester_id) => update({ semester_id })}
            />
            <FieldRow>
              <Field
                label="Module code"
                value={draft.module_code}
                autoCapitalize="characters"
                placeholder="CS101"
                error={form.problems.module_code}
                onChangeText={(module_code) => update({ module_code })}
              />
              <Field
                label="Credit hours"
                value={String(draft.credit_hours)}
                keyboardType="number-pad"
                error={form.problems.credit_hours}
                onChangeText={(text) => update({ credit_hours: Number(text) || 0 })}
              />
            </FieldRow>
            <Field
              label="Module name"
              value={draft.module_name}
              placeholder="Programming Fundamentals"
              error={form.problems.module_name}
              onChangeText={(module_name) => update({ module_name })}
            />
          </>
        )}
      </FormSheet>
    </Screen>
  );
}
