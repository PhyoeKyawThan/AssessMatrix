import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { catalogApi, type Major, type Semester, type StudentPlacement } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { usersApi, type User } from '@/features/users/api';
import { usePaged } from '@/shared/api/use-page';
import { useSubmit } from '@/shared/api/use-resource';
import { Badge, Body, Button, CheckRow, DateField, ErrorBanner, Pager, Picker, RecordRow, ResponsiveDataView, Screen, Sheet } from '@/shared/ui';

export function StudentPlacementsScreen() {
  const [adding, setAdding] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [studentId, setStudentId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [majorId, setMajorId] = useState('');
  const [studyYear, setStudyYear] = useState('1');
  const [admittedOn, setAdmittedOn] = useState('');
  const submit = useSubmit();

  const placements = usePaged<StudentPlacement>(
    (page) => catalogApi.placements.list({ page, page_size: 100, is_current: 'true' }),
    [],
  );
  const students = usePaged<User>((page) => usersApi.list({ page, page_size: 100, role: 'STUDENT', is_active: 'true' }), []);
  const semesters = usePaged<Semester>((page) => catalogApi.semesters.list({ page, page_size: 100 }), []);
  const majors = usePaged<Major>((page) => catalogApi.majors.list({ page, page_size: 100, is_active: 'true' }), []);

  const studentOptions = useMemo(() => students.items.map((item) => ({ value: item.id, label: item.full_name || item.email })), [students.items]);
  const semesterOptions = useMemo(() => semesters.items.map((item) => ({ value: item.id, label: `${item.academic_year} · ${item.semester_name}` })), [semesters.items]);
  const majorOptions = useMemo(() => majors.items.map((item) => ({ value: item.id, label: `${item.code} — ${item.name}` })), [majors.items]);
  const selectedSemester = semesterId || semesterOptions[0]?.value || '';
  const selectedMajor = majorId || majorOptions[0]?.value || '';

  const reset = () => {
    setStudentId('');
    setSemesterId('');
    setMajorId('');
    setStudyYear('1');
    setAdmittedOn('');
    submit.reset();
  };

  const create = async () => {
    const ok = await submit.run(
      () => catalogApi.placements.create({
        student_id: studentId,
        semester_id: selectedSemester,
        major_id: selectedMajor,
        study_year: Number(studyYear),
        admitted_on: admittedOn,
        is_current: true,
      }),
      'Student placement created.',
    );
    if (ok) {
      setAdding(false);
      reset();
      placements.reload();
    }
  };

  const promote = async () => {
    const ok = await submit.run(
      () => catalogApi.placements.promote({ student_ids: picked, target_semester_id: selectedSemester, target_study_year: Number(studyYear) }),
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
        subtitle="Set each student's current major and semester, then promote a selected cohort without changing its history."
        actions={
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Button label="Add placement" variant="secondary" onPress={() => { reset(); setAdding(true); }} />
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
          { key: 'year', label: 'Study year', minWidth: 100, render: (placement) => <Body tone="secondary">Year {placement.study_year}</Body> },
          { key: 'academic', label: 'Academic', minWidth: 120, render: (placement) => <Body tone="secondary">{placement.academic_year}</Body> },
          { key: 'semester', label: 'Semester', minWidth: 130, render: (placement) => <Body tone="secondary">{placement.semester_name}</Body> },
          { key: 'status', label: 'Status', minWidth: 90, render: () => <Badge label="Current" tone="success" /> },
        ]}
        renderCard={(placement) => (
          <RecordRow
            title={placement.student.full_name || placement.student.email}
            subtitle={`${placement.major.code} · Year ${placement.study_year} · ${placement.academic_year} · ${placement.semester_name}`}
            badge={<Badge label="Current" tone="success" />}
          />
        )}
      />

      <Sheet title="Add student placement" visible={adding} onDismiss={() => setAdding(false)}>
        {submit.error ? <ErrorBanner title="Could not add placement" messages={submit.error} /> : null}
        <Picker label="Student" loading={students.loading} options={studentOptions} value={studentId} onChange={setStudentId} />
        <Picker label="Major" loading={majors.loading} options={majorOptions} value={selectedMajor} onChange={setMajorId} />
        <Picker label="Study year" options={[1, 2, 3, 4, 5].map((year) => ({ value: String(year), label: `Year ${year}` }))} value={studyYear} onChange={setStudyYear} />
        <Picker label="Academic year and semester" loading={semesters.loading} options={semesterOptions} value={selectedSemester} onChange={setSemesterId} />
        <DateField label="Admission date" value={admittedOn} onChange={setAdmittedOn} />
        <Button label="Create placement" loading={submit.pending} disabled={!studentId || !selectedMajor || !selectedSemester || !admittedOn} onPress={create} />
      </Sheet>

      <Sheet title="Batch promote students" visible={promoting} onDismiss={() => setPromoting(false)}>
        {submit.error ? <ErrorBanner title="Could not promote cohort" messages={submit.error} /> : null}
        <Picker label="Target academic year and semester" loading={semesters.loading} options={semesterOptions} value={selectedSemester} onChange={setSemesterId} />
        <Picker label="Target study year" options={[1, 2, 3, 4, 5].map((year) => ({ value: String(year), label: `Year ${year}` }))} value={studyYear} onChange={setStudyYear} />
        <Body tone="muted">Major and original admission date carry forward. Previous placements remain in history.</Body>
        <View style={{ gap: 8 }}>
          {placements.items.map((placement) => (
            <CheckRow
              key={placement.id}
              title={placement.student.full_name || placement.student.email}
              subtitle={`${placement.major.code} · Year ${placement.study_year} · ${placement.academic_year} · ${placement.semester_name}`}
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
