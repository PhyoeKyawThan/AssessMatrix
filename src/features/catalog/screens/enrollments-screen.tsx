import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { catalogApi, type Enrollment, type EnrollmentStatus, type EnrollmentBulkResult, type Module } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { ResourceList } from '@/features/shell/components/resource-list';
import { usersApi, type User } from '@/features/users/api';
import { apiRequest } from '@/shared/api/client';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import { useSubmit } from '@/shared/api/use-resource';
import { formatDate } from '@/shared/utils/format';
import {
  Badge,
  Body,
  Button,
  Card,
  CheckRow,
  ErrorBanner,
  Field,
  OptionChips,
  Pager,
  Picker,
  RecordRow,
  Screen,
  Sheet,
} from '@/shared/ui';

interface Draft {
  id: string | null;
  student_id: string;
  module_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  student: Enrollment['student'] | null;
  module: Enrollment['module'] | null;
}

const STATUSES: EnrollmentStatus[] = ['ENROLLED', 'DROPPED', 'COMPLETED'];

function statusTone(status: EnrollmentStatus) {
  if (status === 'ENROLLED') return 'info' as const;
  if (status === 'COMPLETED') return 'success' as const;
  return 'neutral' as const;
}

export function EnrollmentsScreen() {
  const { user } = useAuth();
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [adding, setAdding] = useState(false);
  const [bulking, setBulking] = useState(false);

  const modules = usePaged<Module>((page) => catalogApi.modules.list({ page, page_size: 100 }), []);
  const moduleOptions = useMemo(
    () => modules.items.map((item) => ({ value: item.id, label: `${item.module_code} — ${item.module_name}` })),
    [modules.items],
  );
  const activeModule = moduleId ?? modules.items[0]?.id ?? '';

  const list = usePaged<Enrollment>(
    (page) =>
      catalogApi.enrollments.list({
        page,
        module_id: activeModule || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }),
    [activeModule, statusFilter],
  );

  const form = useEntityForm<Draft>({
    blank: {
      id: null,
      student_id: '',
      module_id: activeModule,
      status: 'ENROLLED',
      enrolled_at: '',
      student: null,
      module: null,
    },
    validate: (value) => ({
      student_id: value.student_id === '' ? 'Choose a student.' : null,
      module_id: value.module_id === '' ? 'Choose a module.' : null,
    }),
    save: (value) =>
      value.id === null
        ? catalogApi.enrollments.create({ student_id: value.student_id, module_id: value.module_id })
        : apiRequest<Enrollment>(`/api/enrollments/${value.id}/`, { method: 'PATCH', body: { status: value.status } }),
    remove: (id) => catalogApi.enrollments.remove(id),
    onSaved: () => list.reload(),
  });

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Enrollments"
        subtitle="Students inside modules. A dropped student keeps their marks but is left out of grading checks."
        actions={
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Button label="Add student" variant="secondary" onPress={() => setAdding(true)} />
            <Button label="Bulk add" onPress={() => setBulking(true)} />
          </View>
        }
      />

      <Card title="Filters">
        <View style={{ gap: 14 }}>
          <Picker
            label="Module"
            loading={modules.loading}
            options={moduleOptions}
            value={activeModule}
            onChange={(value) => {
              setModuleId(value);
              list.setPage(1);
            }}
          />
          <OptionChips
            label="Status"
            value={statusFilter}
            onChange={(next) => {
              setStatusFilter(next);
              list.setPage(1);
            }}
            options={[{ value: 'ALL', label: 'All' }, ...STATUSES.map((status) => ({ value: status, label: status }))]}
          />
        </View>
      </Card>

      <Body tone="muted">
        {list.count} enrollment{list.count === 1 ? '' : 's'} shown. Signed in as {user?.full_name ?? '—'}.
      </Body>

      <ResourceList
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="Nobody is enrolled here yet."
        onRetry={list.reload}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        renderItem={(enrollment) => (
          <RecordRow
            title={enrollment.student.full_name || enrollment.student.email}
            subtitle={enrollment.student.email}
            badge={
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Badge label={enrollment.module.module_code} tone="neutral" />
                <Badge label={enrollment.status} tone={statusTone(enrollment.status)} />
              </View>
            }
            onPress={() => form.open({ ...enrollment })}
          />
        )}
      />

      <FormSheet
        title={form.draft?.id === null || form.draft === undefined ? 'Enrol a student' : 'Change enrollment'}
        form={form}
        hint="A repeat enrollment returns 409. Delete is blocked once a mark exists — drop the student instead."
      >
        {(value, update) =>
          value.id === null ? (
            <>
              <Picker label="Module" options={moduleOptions} value={value.module_id} onChange={(module_id) => update({ module_id })} />
              <StudentPicker selected={value.student_id} onChange={(student_id) => update({ student_id })} />
            </>
          ) : (
            <>
              <Body tone="muted">
                {`${value.student?.full_name ?? ''} · ${value.module?.module_code ?? ''} · enrolled ${formatDate(value.enrolled_at)}`}
              </Body>
              <OptionChips<EnrollmentStatus>
                label="Status"
                options={STATUSES.map((status) => ({ value: status, label: status }))}
                value={value.status}
                onChange={(status) => update({ status })}
              />
            </>
          )
        }
      </FormSheet>

      {adding ? (
        <AddSingleSheet
          moduleOptions={moduleOptions}
          defaultModule={activeModule}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            list.reload();
          }}
        />
      ) : null}

      {bulking ? (
        <BulkSheet
          moduleOptions={moduleOptions}
          defaultModule={activeModule}
          onClose={() => setBulking(false)}
          onSaved={() => {
            setBulking(false);
            list.reload();
          }}
        />
      ) : null}
    </Screen>
  );
}

function StudentPicker({ selected, onChange }: { selected: string; onChange: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const students = usePaged<User>(
    (page) => usersApi.list({ page, page_size: 100, role: 'STUDENT', search: search || undefined }),
    [search],
  );

  return (
    <View style={{ gap: 12 }}>
      <Field
        label="Find student"
        value={search}
        autoCapitalize="none"
        placeholder="Name, email or username"
        onChangeText={setSearch}
      />
      <ResourceList
        grid={false}
        items={students.items}
        loading={students.loading}
        error={students.error}
        emptyMessage="No students match."
        onRetry={students.reload}
        renderItem={(student) => (
          <RecordRow
            title={student.full_name || student.username}
            subtitle={student.email}
            badge={
              <Badge
                label={student.id === selected ? 'Selected' : 'Choose'}
                tone={student.id === selected ? 'info' : 'neutral'}
              />
            }
            onPress={() => onChange(student.id)}
          />
        )}
      />
    </View>
  );
}

interface PickerSheetProps {
  moduleOptions: { value: string; label: string }[];
  defaultModule: string;
  onClose: () => void;
  onSaved: () => void;
}

function AddSingleSheet({ moduleOptions, defaultModule, onClose, onSaved }: PickerSheetProps) {
  const [studentId, setStudentId] = useState('');
  const [moduleId, setModuleId] = useState(defaultModule);
  const submit = useSubmit();

  return (
    <Sheet title="Enrol one student" visible onDismiss={onClose}>
      {submit.error !== null ? <ErrorBanner title="Could not enrol" messages={submit.error} /> : null}
      {submit.notice !== null ? <Body tone="success">{submit.notice}</Body> : null}
      <View style={{ gap: 16 }}>
        <Picker label="Module" options={moduleOptions} value={moduleId} onChange={setModuleId} />
        <StudentPicker selected={studentId} onChange={setStudentId} />
        <Button
          label="Enrol"
          loading={submit.pending}
          disabled={studentId === '' || moduleId === ''}
          onPress={async () => {
            const ok = await submit.run(
              () => catalogApi.enrollments.create({ student_id: studentId, module_id: moduleId }),
              (result) => `${(result as Enrollment).student?.full_name ?? 'Student'} enrolled.`,
            );
            if (ok) {
              setStudentId('');
              onSaved();
            }
          }}
        />
      </View>
    </Sheet>
  );
}

function BulkSheet({ moduleOptions, defaultModule, onClose, onSaved }: PickerSheetProps) {
  const [moduleId, setModuleId] = useState(defaultModule);
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const submit = useSubmit();
  const students = usePaged<User>(
    (page) => usersApi.list({ page, page_size: 100, role: 'STUDENT', search: search || undefined }),
    [search],
  );

  const toggle = (id: string) =>
    setPicked((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  return (
    <Sheet title="Bulk enrollment" visible onDismiss={onClose}>
      {submit.error !== null ? <ErrorBanner title="Nothing was created" messages={submit.error} /> : null}
      {submit.notice !== null ? <Body tone="success">{submit.notice}</Body> : null}
      <View style={{ gap: 16 }}>
        <Picker label="Class list" options={moduleOptions} value={moduleId} onChange={setModuleId} />
        <Field
          label="Find students"
          value={search}
          autoCapitalize="none"
          placeholder="Name, email or username"
          onChangeText={setSearch}
        />
        <Body tone="muted">{picked.length} selected. Students already in the module are skipped, not an error.</Body>
        <ResourceList
          grid={false}
          items={students.items}
          loading={students.loading}
          error={students.error}
          emptyMessage="No students match."
          onRetry={students.reload}
          renderItem={(student) => (
            <CheckRow
              title={student.full_name || student.username}
              subtitle={student.email}
              checked={picked.includes(student.id)}
              onToggle={() => toggle(student.id)}
            />
          )}
        />
        <Button
          label={picked.length === 0 ? 'Select students' : `Enrol ${picked.length}`}
          loading={submit.pending}
          disabled={picked.length === 0 || moduleId === ''}
          onPress={async () => {
            const ok = await submit.run(
              () => catalogApi.enrollments.bulk({ module_id: moduleId, student_ids: picked }),
              (result) => {
                const data = result as EnrollmentBulkResult;
                return `${data.created.length} created, ${data.skipped.length} skipped.`;
              },
            );
            if (ok) {
              setPicked([]);
              onSaved();
            }
          }}
        />
      </View>
    </Sheet>
  );
}
