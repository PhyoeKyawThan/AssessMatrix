import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { catalogApi, type Major, type Module, type TeachingPeriod } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { FormSheet } from '@/features/shell/components/form-sheet';
import { useEntityForm } from '@/shared/api/use-entity-form';
import { usePaged } from '@/shared/api/use-page';
import { useSubmit } from '@/shared/api/use-resource';
import { Badge, Body, Button, CheckRow, ErrorBanner, Field, OptionChips, Pager, Picker, RecordRow, ResponsiveDataView, Screen, Sheet } from '@/shared/ui';

interface Draft {
  id: string | null;
  definition_id: string;
  semester_id: string;
  module_code: string;
  module_name: string;
  study_year: number;
  eligible_major_ids: string[];
}

type StudyYearFilter = 'ALL' | '1' | '2' | '3' | '4' | '5';

export function ModulesScreen() {
  const [pickedPeriod, setPickedPeriod] = useState<string | null>(null);
  const [planned, setPlanned] = useState<'ALL' | 'OFFERED' | 'UNOFFERED'>('ALL');
  const [studyYear, setStudyYear] = useState<StudyYearFilter>('ALL');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [copying, setCopying] = useState<Module | null>(null);
  const [copySemesterId, setCopySemesterId] = useState('');
  const copySubmit = useSubmit();

  const periods = usePaged<TeachingPeriod>((page) => catalogApi.teachingPeriods.list({ page, page_size: 100 }), []);
  const activePeriods = periods.items.filter((item) => item.status === 'ACTIVE');
  const semesterId = pickedPeriod ?? activePeriods[0]?.id ?? periods.items[0]?.id ?? '';
  const selectedPeriod = periods.items.find((item) => item.id === semesterId);
  const majors = usePaged<Major>((page) => catalogApi.majors.list({ page, page_size: 100, is_active: 'true' }), []);
  const definitions = usePaged((page) => catalogApi.moduleDefinitions.list({ page, page_size: 200, is_active: 'true' }), []);
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

  const periodOptions = useMemo(
    () => periods.items.map((item) => ({ value: item.id, label: `${item.academic_label} · ${item.name} · ${item.status}` })),
    [periods.items],
  );
  const currentSemesterOptions = useMemo(
    () => activePeriods.map((item) => ({ value: item.id, label: `${item.academic_label} · ${item.name}` })),
    [activePeriods],
  );
  const definitionOptions = useMemo(() => [
    { value: 'NEW', label: 'Create a new catalogue module' },
    ...definitions.items.map((item) => ({ value: item.id, label: `${item.code} — ${item.name}` })),
  ], [definitions.items]);

  const form = useEntityForm<Draft>({
    blank: { id: null, definition_id: 'NEW', semester_id: semesterId, module_code: '', module_name: '', study_year: 1, eligible_major_ids: [] },
    validate: (draft) => ({
      module_code: draft.module_code.trim() === '' ? 'Required, for example CS101.' : null,
      module_name: draft.module_name.trim() === '' ? 'Required.' : null,
    }),
    save: (draft) => {
      const body = {
        semester_id: draft.semester_id,
        definition_id: draft.definition_id === 'NEW' ? undefined : draft.definition_id,
        module_code: draft.module_code,
        module_name: draft.module_name,
        study_year: draft.study_year,
        eligible_major_ids: draft.eligible_major_ids,
      };
      return draft.id === null ? catalogApi.modules.create(body) : catalogApi.modules.update(draft.id, body);
    },
    remove: (id) => catalogApi.modules.remove(id),
    onSaved: () => list.reload(),
  });

  const openModule = (module: Module) => {
    if (selectedPeriod?.status !== 'ACTIVE') {
      setCopying(module);
      setCopySemesterId('');
      copySubmit.reset();
      return;
    }
    form.open({
      id: module.id,
      definition_id: module.definition_id,
      semester_id: module.semester_id,
      module_code: module.module_code,
      module_name: module.module_name,
      study_year: module.study_year,
      eligible_major_ids: module.eligible_majors.map((major) => major.id),
    });
  };
  const activeFilterCount = (pickedPeriod ? 1 : 0) + (planned === 'ALL' ? 0 : 1) + (studyYear === 'ALL' ? 0 : 1) + (search ? 1 : 0);

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Modules"
        subtitle="Manage offerings in a teaching period. Permanent Semester 1–10 placement is defined in Curriculum."
        actions={<><Button label={activeFilterCount ? `Filter (${activeFilterCount})` : 'Filter'} variant="secondary" onPress={() => setFiltersOpen(true)} />{selectedPeriod?.status === 'ACTIVE' ? <Button label="New offering" onPress={() => form.open({ id: null, definition_id: 'NEW', semester_id: semesterId, module_code: '', module_name: '', study_year: 1, eligible_major_ids: [] })} /> : null}</>}
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
        renderCard={(module) => <RecordRow title={`${module.module_code} — ${module.module_name}`} subtitle={`Semester ${(module.study_year - 1) * 2 + module.period_number} · ${module.lecture_plan === null ? 'No teacher assigned yet' : `Assigned to ${module.lecture_plan.lecturer.full_name}`}`} badge={<Badge label={module.lecture_plan?.status === 'PUBLISHED' ? 'Published' : module.lecture_plan ? 'Planning' : 'Not offered'} tone={module.lecture_plan?.status === 'PUBLISHED' ? 'success' : module.lecture_plan ? 'info' : 'danger'} />} trailing={!module.lecture_plan && module.teaching_period_status !== 'ACTIVE' ? <Button label="Reuse" variant="secondary" onPress={() => { setCopying(module); setCopySemesterId(''); copySubmit.reset(); }} /> : undefined} onPress={() => openModule(module)} />}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
      />

      <Sheet title="Filter modules" visible={filtersOpen} onDismiss={() => setFiltersOpen(false)}>
        <Picker label="Teaching period" loading={periods.loading} options={periodOptions} value={semesterId} onChange={(value) => { setPickedPeriod(value); list.setPage(1); }} />
        <OptionChips label="Offer status" value={planned} onChange={(value) => { setPlanned(value); list.setPage(1); }} options={[{ value: 'ALL', label: 'All' }, { value: 'OFFERED', label: 'Has a teacher' }, { value: 'UNOFFERED', label: 'Not offered' }]} />
        <OptionChips label="Study year" value={studyYear} onChange={(value) => { setStudyYear(value); list.setPage(1); }} options={[{ value: 'ALL', label: 'All' }, { value: '1', label: 'Year 1' }, { value: '2', label: 'Year 2' }, { value: '3', label: 'Year 3' }, { value: '4', label: 'Year 4' }, { value: '5', label: 'Year 5' }]} />
        <Field label="Search" value={search} autoCapitalize="none" placeholder="Module code or name" onChangeText={setSearch} onSubmitEditing={() => list.setPage(1)} />
        <Button label="Show results" onPress={() => { list.setPage(1); setFiltersOpen(false); }} />
      </Sheet>

      <FormSheet title={form.draft?.id === null || form.draft === undefined ? 'New module offering' : 'Edit module offering'} form={form} hint="The catalogue definition is permanent; this offering belongs only to the selected teaching period.">
        {(draft, update) => <>
          <Picker label="Teaching period" options={periodOptions} value={draft.semester_id} onChange={(semester_id) => update({ semester_id })} />
          <Picker label="Study year" options={[1, 2, 3, 4, 5].map((year) => ({ value: String(year), label: `Year ${year}` }))} value={String(draft.study_year)} onChange={(value) => update({ study_year: Number(value) })} />
          <Picker
            label="Catalogue module"
            loading={definitions.loading}
            options={definitionOptions}
            value={draft.definition_id}
            onChange={(definition_id) => {
              const selected = definitions.items.find((item) => item.id === definition_id);
              update({
                definition_id,
                module_code: selected?.code ?? '',
                module_name: selected?.name ?? '',
              });
            }}
          />
          <Field label="Module code" value={draft.module_code} editable={draft.definition_id === 'NEW'} autoCapitalize="characters" placeholder="CS101" error={form.problems.module_code} onChangeText={(module_code) => update({ module_code })} />
          <Field label="Module name" value={draft.module_name} editable={draft.definition_id === 'NEW'} placeholder="Programming Fundamentals" error={form.problems.module_name} onChangeText={(module_name) => update({ module_name })} />
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
        <Picker label="Active teaching period" loading={periods.loading} options={currentSemesterOptions} value={copySemesterId || currentSemesterOptions[0]?.value || ''} onChange={setCopySemesterId} />
        <Button label="Add to active period" loading={copySubmit.pending} disabled={!copying || !(copySemesterId || currentSemesterOptions[0]?.value)} onPress={async () => {
          if (!copying) return;
          const target = copySemesterId || currentSemesterOptions[0]?.value || '';
          const ok = await copySubmit.run(() => catalogApi.modules.copy(copying.id, target), 'Module added to the active teaching period.');
          if (ok) { setCopying(null); list.reload(); }
        }} />
      </Sheet>
    </Screen>
  );
}
