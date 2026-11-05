import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { catalogApi, type Major, type StudentPlacement, type TeachingPeriod } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { usersApi, type User } from '@/features/users/api';
import { usePaged } from '@/shared/api/use-page';
import { useSubmit } from '@/shared/api/use-resource';
import { Badge, Body, Button, CheckRow, DateField, ErrorBanner, Field, Pager, Picker, RecordRow, ResponsiveDataView, Screen, Sheet } from '@/shared/ui';

export function StudentPlacementsScreen() {
  const [adding, setAdding] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [placementPicked, setPlacementPicked] = useState<string[]>([]);
  const [placeAll, setPlaceAll] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [majorId, setMajorId] = useState('');
  const [programmeSemester, setProgrammeSemester] = useState('1');
  const [admittedOn, setAdmittedOn] = useState('');
  const submit = useSubmit();

  const placements = usePaged<StudentPlacement>(
    (page) => catalogApi.placements.list({ page, page_size: 100, is_current: 'true' }),
    [],
  );
  const students = usePaged<User>((page) => usersApi.list({
    page, page_size: 100, role: 'STUDENT', is_active: 'true',
    placement_status: 'unplaced', search: studentSearch || undefined,
  }), [studentSearch]);
  const periods = usePaged<TeachingPeriod>((page) => catalogApi.teachingPeriods.list({ page, page_size: 100 }), []);
  const majors = usePaged<Major>((page) => catalogApi.majors.list({ page, page_size: 100, is_active: 'true' }), []);

  const semesterOptions = useMemo(() => periods.items
    .filter((item) => item.period_number === (Number(programmeSemester) % 2 === 0 ? 2 : 1))
    .map((item) => ({ value: item.id, label: `${item.academic_label} · ${item.name}` })), [periods.items, programmeSemester]);
  const majorOptions = useMemo(() => majors.items.map((item) => ({ value: item.id, label: `${item.code} — ${item.name}` })), [majors.items]);
  const selectedSemester = semesterId || semesterOptions[0]?.value || '';
  const selectedMajor = majorId || majorOptions[0]?.value || '';

  const reset = () => {
    setPlacementPicked([]);
    setPlaceAll(false);
    setStudentSearch('');
    setSemesterId('');
    setMajorId('');
    setProgrammeSemester('1');
    setAdmittedOn('');
    submit.reset();
  };

  const create = async () => {
    const ok = await submit.run(
      () => catalogApi.placements.bulk({
        student_ids: placeAll ? undefined : placementPicked,
        all_unplaced: placeAll,
        teaching_period_id: selectedSemester,
        major_id: selectedMajor,
        programme_semester: Number(programmeSemester),
        admitted_on: admittedOn,
      }),
      (result) => `${(result as { created_count: number }).created_count} student placements created.`,
    );
    if (ok) {
      setAdding(false);
      reset();
      placements.reload();
      students.reload();
    }
  };

  const promote = async () => {
    const ok = await submit.run(
      () => catalogApi.placements.promote({ student_ids: picked, target_semester_id: selectedSemester, target_study_year: Math.ceil(Number(programmeSemester) / 2) }),
      `${picked.length} student placements promoted.`,
    );
    if (ok) {
      setPromoting(false);
      setPicked([]);
      reset();
      placements.reload();
    }
  };

  return (
    <Screen scroll>
      <AppHeader
        title="Student cohorts"
        subtitle="Set each student's fixed programme semester and current teaching period, then promote a cohort without changing its history."
        actions={
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Button label="Place students" variant="secondary" onPress={() => { reset(); setAdding(true); }} />
            <Button label="Batch promote" onPress={() => { reset(); setPromoting(true); }} />
          </View>
        }
      />
      <ResponsiveDataView
        items={placements.items}
        loading={placements.loading}
        error={placements.error}
        emptyMessage="No students have a current semester placement."
        onRetry={placements.reload}
        footer={<Pager page={placements.page} pageCount={placements.pageCount} onChange={placements.setPage} disabled={placements.loading} />}
        keyExtractor={(placement) => placement.id}
        columns={[
          { key: 'student', label: 'Student', minWidth: 180, flex: 1.5, render: (placement) => <Body>{placement.student.full_name || placement.student.email}</Body> },
          { key: 'email', label: 'Email', minWidth: 180, flex: 1.4, render: (placement) => <Body tone="secondary">{placement.student.email}</Body> },
          { key: 'major', label: 'Major', minWidth: 100, render: (placement) => <Body>{placement.major.code}</Body> },
          { key: 'semester', label: 'Programme semester', minWidth: 150, render: (placement) => <Body tone="secondary">Semester {placement.programme_semester}</Body> },
          { key: 'period', label: 'Teaching period', minWidth: 190, render: (placement) => <Body tone="secondary">{placement.academic_year} · {placement.semester_name}</Body> },
          { key: 'status', label: 'Status', minWidth: 90, render: () => <Badge label="Current" tone="success" /> },
        ]}
        renderCard={(placement) => (
          <RecordRow
            title={placement.student.full_name || placement.student.email}
            subtitle={`${placement.major.code} · Semester ${placement.programme_semester} · ${placement.academic_year} · ${placement.semester_name}`}
            badge={<Badge label="Current" tone="success" />}
          />
        )}
      />

      <Sheet title="Place students in bulk" visible={adding} onDismiss={() => setAdding(false)}>
        {submit.error ? <ErrorBanner title="Could not create placements" messages={submit.error} /> : null}
        <Picker label="Major" loading={majors.loading} options={majorOptions} value={selectedMajor} onChange={setMajorId} />
        <Picker label="Programme semester" options={Array.from({ length: 10 }, (_, index) => ({ value: String(index + 1), label: `Semester ${index + 1}` }))} value={programmeSemester} onChange={(value) => { setProgrammeSemester(value); setSemesterId(''); }} />
        <Picker label="Teaching period" loading={periods.loading} options={semesterOptions} value={selectedSemester} onChange={setSemesterId} />
        <DateField label="Admission date" value={admittedOn} onChange={setAdmittedOn} />
        <CheckRow
          title={`Place all ${students.count} unplaced students`}
          subtitle="Use this only when every currently unplaced student belongs to the selected major and semester."
          checked={placeAll}
          onToggle={() => { setPlaceAll((current) => !current); setPlacementPicked([]); setStudentSearch(''); }}
        />
        {!placeAll ? (
          <View style={{ gap: 8 }}>
            <Field label="Find students" placeholder="Name, email, or username" value={studentSearch} onChangeText={setStudentSearch} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button
                label={`Select visible (${students.items.length})`}
                variant="secondary"
                onPress={() => setPlacementPicked(students.items.map((student) => student.id))}
              />
              {placementPicked.length ? <Button label="Clear selection" variant="secondary" onPress={() => setPlacementPicked([])} /> : null}
            </View>
            <Body tone="muted">{placementPicked.length} selected. Search to narrow large student lists, or use the all-unplaced option above.</Body>
            {students.items.map((student) => (
              <CheckRow
                key={student.id}
                title={student.full_name || student.email}
                subtitle={student.email}
                checked={placementPicked.includes(student.id)}
                onToggle={() => setPlacementPicked((current) => current.includes(student.id) ? current.filter((id) => id !== student.id) : [...current, student.id])}
              />
            ))}
          </View>
        ) : null}
        <Button
          label={placeAll ? `Place all ${students.count} students` : `Place ${placementPicked.length} students`}
          loading={submit.pending}
          disabled={(!placeAll && !placementPicked.length) || !selectedMajor || !selectedSemester || !admittedOn}
          onPress={create}
        />
      </Sheet>

      <Sheet title="Batch promote students" visible={promoting} onDismiss={() => setPromoting(false)}>
        {submit.error ? <ErrorBanner title="Could not promote cohort" messages={submit.error} /> : null}
        <Picker label="Target programme semester" options={Array.from({ length: 10 }, (_, index) => ({ value: String(index + 1), label: `Semester ${index + 1}` }))} value={programmeSemester} onChange={(value) => { setProgrammeSemester(value); setSemesterId(''); }} />
        <Picker label="Target teaching period" loading={periods.loading} options={semesterOptions} value={selectedSemester} onChange={setSemesterId} />
        <Body tone="muted">Major and original admission date carry forward. Previous placements remain in history.</Body>
        <View style={{ gap: 8 }}>
          {placements.items.map((placement) => (
            <CheckRow
              key={placement.id}
              title={placement.student.full_name || placement.student.email}
              subtitle={`${placement.major.code} · Semester ${placement.programme_semester} · ${placement.academic_year} · ${placement.semester_name}`}
              checked={picked.includes(placement.student_id)}
              onToggle={() => setPicked((current) => current.includes(placement.student_id) ? current.filter((id) => id !== placement.student_id) : [...current, placement.student_id])}
            />
          ))}
        </View>
        <Button label={picked.length ? `Promote ${picked.length} students` : 'Select students'} loading={submit.pending} disabled={!picked.length || !selectedSemester} onPress={promote} />
      </Sheet>
    </Screen>
  );
}
