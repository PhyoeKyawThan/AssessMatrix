import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { catalogApi, type Academic, type Major, type Module, type Semester } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import { useSubmit } from '@/shared/api/use-resource';
import { Badge, Body, Button, CheckRow, ErrorBanner, Field, OptionChips, Pager, Picker, RecordRow, ResponsiveDataView, Screen, Sheet } from '@/shared/ui';

interface Draft {
  id: string | null;
  semester_id: string;
  module_code: string;
  module_name: string;
  study_year: number;
  eligible_major_ids: string[];
}

type StudyYearFilter = 'ALL' | '1' | '2' | '3' | '4' | '5';

export function ModulesScreen() {
  const [yearScope, setYearScope] = useState<'CURRENT' | 'HISTORY'>('CURRENT');
  const [pickedAcademic, setPickedAcademic] = useState<string | null>(null);
  const [pickedSemester, setPickedSemester] = useState<string | null>(null);
  const [planned, setPlanned] = useState<'ALL' | 'OFFERED' | 'UNOFFERED'>('ALL');
  const [studyYear, setStudyYear] = useState<StudyYearFilter>('ALL');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [copying, setCopying] = useState<Module | null>(null);
  const [copySemesterId, setCopySemesterId] = useState('');
  const copySubmit = useSubmit();

  const academics = usePaged<Academic>((page) => catalogApi.academics.list({ page, page_size: 100 }), []);
  const currentAcademicId = academics.items.find((item) => item.is_current)?.id ?? '';
  const historicalAcademicId = academics.items.find((item) => !item.is_current)?.id ?? '';
  const academicId = yearScope === 'CURRENT' ? currentAcademicId : pickedAcademic ?? historicalAcademicId;
  const semesters = usePaged<Semester>(
    (page) => academicId ? catalogApi.semesters.list({ page, page_size: 100, academic_id: academicId }) : Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
    [academicId],
  );
  const semesterId = pickedSemester ?? semesters.items[0]?.id ?? '';
  const currentSemesters = usePaged<Semester>(
    (page) => currentAcademicId ? catalogApi.semesters.list({ page, page_size: 100, academic_id: currentAcademicId }) : Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
    [currentAcademicId],
  );
  const majors = usePaged<Major>((page) => catalogApi.majors.list({ page, page_size: 100, is_active: 'true' }), []);
  const list = usePaged<Module>(
    (page) => semesterId ? catalogApi.modules.list({
      page,
      semester_id: semesterId,
      search: search || undefined,
      study_year: studyYear === 'ALL' ? undefined : Number(studyYear),
      planned: planned === 'ALL' ? undefined : planned === 'OFFERED' ? 'true' : 'false',
    }) : Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
    [semesterId, search, planned, studyYear],
  );

  const academicOptions = useMemo(
    () => academics.items.filter((item) => yearScope === 'CURRENT' ? item.is_current : !item.is_current).map((item) => ({ value: item.id, label: item.academic_year })),
    [academics.items, yearScope],
  );
  const semesterOptions = useMemo(
    () => semesters.items.map((item) => ({ value: item.id, label: `${item.semester_no}. ${item.semester_name}` })),
    [semesters.items],
  );
  const currentSemesterOptions = useMemo(
    () => currentSemesters.items.map((item) => ({ value: item.id, label: `${item.academic_year} · ${item.semester_name}` })),
    [currentSemesters.items],
  );

  const form = useEntityForm<Draft>({
    blank: { id: null, semester_id: semesterId, module_code: '', module_name: '', study_year: 1, eligible_major_ids: [] },
    validate: (draft) => ({
      module_code: draft.module_code.trim() === '' ? 'Required, for example CS101.' : null,
      module_name: draft.module_name.trim() === '' ? 'Required.' : null,
    }),
    save: (draft) => {
      const body = { semester_id: draft.semester_id, module_code: draft.module_code, module_name: draft.module_name, study_year: draft.study_year, eligible_major_ids: draft.eligible_major_ids };
      return draft.id === null ? catalogApi.modules.create(body) : catalogApi.modules.update(draft.id, body);
    },
    remove: (id) => catalogApi.modules.remove(id),
    onSaved: () => list.reload(),
  });

  const openModule = (module: Module) => {
    if (yearScope === 'HISTORY') {
      setCopying(module);
      setCopySemesterId('');
      copySubmit.reset();
      return;
    }
    form.open({
      id: module.id,
      semester_id: module.semester_id,
      module_code: module.module_code,
      module_name: module.module_name,
      study_year: module.study_year,
      eligible_major_ids: module.eligible_majors.map((major) => major.id),
    });
  };
  const activeFilterCount = (yearScope === 'HISTORY' ? 1 : 0) + (planned === 'ALL' ? 0 : 1) + (studyYear === 'ALL' ? 0 : 1) + (search ? 1 : 0);

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Modules"
        subtitle="Manage current module offerings or reuse a module from academic history without copying its teacher or assessments."
        actions={<><Button label={activeFilterCount ? `Filter (${activeFilterCount})` : 'Filter'} variant="secondary" onPress={() => setFiltersOpen(true)} />{yearScope === 'CURRENT' ? <Button label="New module" onPress={() => form.open({ id: null, semester_id: semesterId, module_code: '', module_name: '', study_year: 1, eligible_major_ids: [] })} /> : null}</>}
      />

      <ResponsiveDataView
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No module matches these filters."
        onRetry={list.reload}
        keyExtractor={(module) => module.id}
        onRowPress={openModule}
        columns={[
          { key: 'code', label: 'Code', flex: 0.7, minWidth: 90, render: (module) => <Body>{module.module_code}</Body> },
          { key: 'module', label: 'Module', flex: 1.6, minWidth: 180, render: (module) => <Body>{module.module_name}</Body> },
          { key: 'year', label: 'Study year', flex: 0.7, minWidth: 90, render: (module) => <Body tone="secondary">Year {module.study_year}</Body> },
          { key: 'majors', label: 'Majors', flex: 1, minWidth: 120, render: (module) => <Body tone="secondary">{module.eligible_majors.length ? module.eligible_majors.map((major) => major.code).join(', ') : 'All majors'}</Body> },
          { key: 'teacher', label: 'Teacher', flex: 1.3, minWidth: 160, render: (module) => <Body tone="secondary">{module.lecture_plan?.lecturer.full_name ?? 'Not assigned'}</Body> },
          { key: 'status', label: 'Status', flex: 0.8, minWidth: 105, render: (module) => <Badge label={module.lecture_plan?.status === 'PUBLISHED' ? 'Published' : module.lecture_plan ? 'Planning' : 'Not offered'} tone={module.lecture_plan?.status === 'PUBLISHED' ? 'success' : module.lecture_plan ? 'info' : 'danger'} /> },
        ]}
        renderCard={(module) => <RecordRow title={`${module.module_code} — ${module.module_name}`} subtitle={`Year ${module.study_year} · ${module.lecture_plan === null ? 'No teacher assigned yet' : `Assigned to ${module.lecture_plan.lecturer.full_name}`}`} badge={<Badge label={module.lecture_plan?.status === 'PUBLISHED' ? 'Published' : module.lecture_plan ? 'Planning' : 'Not offered'} tone={module.lecture_plan?.status === 'PUBLISHED' ? 'success' : module.lecture_plan ? 'info' : 'danger'} />} trailing={!module.lecture_plan && module.academic_id !== currentAcademicId ? <Button label="Reuse" variant="secondary" onPress={() => { setCopying(module); setCopySemesterId(''); copySubmit.reset(); }} /> : undefined} onPress={() => openModule(module)} />}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
      />

      <Sheet title="Filter modules" visible={filtersOpen} onDismiss={() => setFiltersOpen(false)}>
        <OptionChips label="View" value={yearScope} onChange={(value) => { setYearScope(value); setPickedAcademic(null); setPickedSemester(null); list.setPage(1); }} options={[{ value: 'CURRENT', label: 'Current modules' }, { value: 'HISTORY', label: 'History' }]} />
        <Picker label="Academic year" loading={academics.loading} options={academicOptions} value={academicId} onChange={(value) => { setPickedAcademic(value); setPickedSemester(null); list.setPage(1); }} />
        <Picker label="Semester" loading={semesters.loading} options={semesterOptions} value={semesterId} onChange={(value) => { setPickedSemester(value); list.setPage(1); }} />
        <OptionChips label="Offer status" value={planned} onChange={(value) => { setPlanned(value); list.setPage(1); }} options={[{ value: 'ALL', label: 'All' }, { value: 'OFFERED', label: 'Has a teacher' }, { value: 'UNOFFERED', label: 'Not offered' }]} />
        <OptionChips label="Study year" value={studyYear} onChange={(value) => { setStudyYear(value); list.setPage(1); }} options={[{ value: 'ALL', label: 'All' }, { value: '1', label: 'Year 1' }, { value: '2', label: 'Year 2' }, { value: '3', label: 'Year 3' }, { value: '4', label: 'Year 4' }, { value: '5', label: 'Year 5' }]} />
        <Field label="Search" value={search} autoCapitalize="none" placeholder="Module code or name" onChangeText={setSearch} onSubmitEditing={() => list.setPage(1)} />
        <Button label="Show results" onPress={() => { list.setPage(1); setFiltersOpen(false); }} />
      </Sheet>

      <FormSheet title={form.draft?.id === null || form.draft === undefined ? 'New module' : 'Edit module'} form={form} hint="Deleting needs no lecture plan and no enrollment.">
        {(draft, update) => <>
          <Picker label="Semester" options={semesterOptions} value={draft.semester_id} onChange={(semester_id) => update({ semester_id })} />
          <Picker label="Study year" options={[1, 2, 3, 4, 5].map((year) => ({ value: String(year), label: `Year ${year}` }))} value={String(draft.study_year)} onChange={(value) => update({ study_year: Number(value) })} />
          <Field label="Module code" value={draft.module_code} autoCapitalize="characters" placeholder="CS101" error={form.problems.module_code} onChangeText={(module_code) => update({ module_code })} />
          <Field label="Module name" value={draft.module_name} placeholder="Programming Fundamentals" error={form.problems.module_name} onChangeText={(module_name) => update({ module_name })} />
          <View style={{ gap: 8 }}>
            <Body tone="secondary">Eligible majors</Body>
            <Body tone="muted">Leave every major unchecked only when this module is available to all majors.</Body>
            {majors.items.map((major) => <CheckRow key={major.id} title={`${major.code} — ${major.name}`} checked={draft.eligible_major_ids.includes(major.id)} onToggle={() => update({ eligible_major_ids: draft.eligible_major_ids.includes(major.id) ? draft.eligible_major_ids.filter((id) => id !== major.id) : [...draft.eligible_major_ids, major.id] })} />)}
          </View>
        </>}
      </FormSheet>

      <Sheet title="Reuse historical module" visible={copying !== null} onDismiss={() => setCopying(null)}>
        {copySubmit.error ? <ErrorBanner title="Could not reuse module" messages={copySubmit.error} /> : null}
        <Body tone="muted">Only the module, study year, semester placement, and eligible majors are copied. Teacher assignments and assessments start empty.</Body>
        {copying ? <Body>{copying.module_code} — {copying.module_name}</Body> : null}
        <Picker label="Current-year semester" loading={currentSemesters.loading} options={currentSemesterOptions} value={copySemesterId || currentSemesterOptions[0]?.value || ''} onChange={setCopySemesterId} />
        <Button label="Add to current year" loading={copySubmit.pending} disabled={!copying || !(copySemesterId || currentSemesterOptions[0]?.value)} onPress={async () => {
          if (!copying) return;
          const target = copySemesterId || currentSemesterOptions[0]?.value || '';
          const ok = await copySubmit.run(() => catalogApi.modules.copy(copying.id, target), 'Module added to the current year.');
          if (ok) { setCopying(null); list.reload(); }
        }} />
      </Sheet>
    </Screen>
  );
}
