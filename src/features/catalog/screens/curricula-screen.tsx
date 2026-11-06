import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { catalogApi, type CurriculumVersion, type TeachingPeriod } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { usePaged } from '@/shared/api/use-page';
import { useSubmit } from '@/shared/api/use-resource';
import { Badge, Body, Button, Card, ErrorBanner, Field, Picker, RecordRow, ResponsiveDataView, Screen, Sheet } from '@/shared/ui';

export function CurriculaScreen() {
  const curricula = usePaged<CurriculumVersion>((page) => catalogApi.curricula.list({ page, page_size: 100 }), []);
  const majors = usePaged((page) => catalogApi.majors.list({ page, page_size: 100, is_active: 'true' }), []);
  const definitions = usePaged((page) => catalogApi.moduleDefinitions.list({ page, page_size: 200, is_active: 'true' }), []);
  const teachingPeriods = usePaged<TeachingPeriod>((page) => catalogApi.teachingPeriods.list({ page, page_size: 100 }), []);
  const submit = useSubmit();
  const [selected, setSelected] = useState<CurriculumVersion | null>(null);
  const [creating, setCreating] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [majorId, setMajorId] = useState('');
  const [name, setName] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [definitionId, setDefinitionId] = useState('');
  const [semesterNumber, setSemesterNumber] = useState(1);
  const [generationPeriodId, setGenerationPeriodId] = useState('');
  const [generationSemester, setGenerationSemester] = useState(1);

  const majorOptions = useMemo(
    () => majors.items.map((major) => ({ value: major.id, label: `${major.code} — ${major.name}` })),
    [majors.items],
  );
  const definitionOptions = useMemo(
    () => definitions.items.map((module) => ({ value: module.id, label: `${module.code} — ${module.name}` })),
    [definitions.items],
  );
  const periodOptions = useMemo(
    () => teachingPeriods.items.map((period) => ({
      value: period.id,
      label: `${period.academic_label} · ${period.name}`,
    })),
    [teachingPeriods.items],
  );
  const activePeriodId = teachingPeriods.items.find((period) => period.status === 'ACTIVE')?.id ?? periodOptions[0]?.value ?? '';
  const selectedMajor = majors.items.find((major) => major.id === selected?.major_id);
  const maxSemester = (selectedMajor?.duration_years ?? 5) * 2;
  const semesterOptions = Array.from({ length: maxSemester }, (_, index) => ({
    value: String(index + 1), label: `Semester ${index + 1}`,
  }));

  const reload = () => {
    curricula.reload();
  };

  const createCurriculum = async () => {
    const ok = await submit.run(
      () => catalogApi.curricula.create({
        major_id: majorId || majorOptions[0]?.value || '',
        name: name.trim(),
        effective_from_id: null,
        status: 'DRAFT',
      }),
      'Curriculum created.',
    );
    if (ok) {
      setCreating(false);
      setName('');
      reload();
    }
  };

  const createDefinition = async () => {
    const ok = await submit.run(
      () => catalogApi.moduleDefinitions.create({
        code: moduleCode.trim().toUpperCase(), name: moduleName.trim(), is_active: true,
      }),
      'Catalogue module created.',
    );
    if (ok) {
      setCatalogOpen(false);
      setModuleCode('');
      setModuleName('');
      definitions.reload();
    }
  };

  const addModule = async () => {
    if (selected === null) return;
    const ok = await submit.run(
      async () => {
        await catalogApi.curriculumModules.create({
          curriculum_id: selected.id,
          module_definition_id: definitionId || definitionOptions[0]?.value || '',
          semester_number: semesterNumber,
        });
        setSelected(await catalogApi.curricula.get(selected.id));
      },
      'Module added to the curriculum.',
    );
    if (ok) reload();
  };

  const removeModule = async (id: string) => {
    if (selected === null) return;
    const ok = await submit.run(async () => {
      await catalogApi.curriculumModules.remove(id);
      setSelected(await catalogApi.curricula.get(selected.id));
    }, 'Module removed.');
    if (ok) reload();
  };

  const generate = async () => {
    const targetPeriodId = generationPeriodId || activePeriodId;
    if (selected === null || !targetPeriodId) return;
    const ok = await submit.run(
      async () => {
        await catalogApi.curricula.generateOfferings(selected.id, targetPeriodId, generationSemester);
        setSelected(await catalogApi.curricula.get(selected.id));
      },
      'Missing offerings generated for the selected teaching period.',
    );
    if (ok) reload();
  };

  return (
    <Screen scroll width="content">
      <AppHeader
        title="Curriculum"
        subtitle="Place modules in fixed Semester 1–10 structures, then open them in a dated teaching period."
        actions={(
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Button label="New catalogue module" variant="secondary" onPress={() => { submit.reset(); setCatalogOpen(true); }} />
            <Button label="New curriculum version" onPress={() => { submit.reset(); setCreating(true); }} />
          </View>
        )}
      />
      {submit.error ? <ErrorBanner title="Could not update curriculum" messages={submit.error} /> : null}
      {submit.notice ? <Body tone="success">{submit.notice}</Body> : null}

      <ResponsiveDataView
        items={curricula.items}
        loading={curricula.loading}
        error={curricula.error}
        emptyMessage="No curriculum versions yet."
        onRetry={curricula.reload}
        keyExtractor={(item) => item.id}
        onRowPress={setSelected}
        columns={[
          { key: 'name', label: 'Curriculum', flex: 1.8, minWidth: 220, render: (item) => <Body>{item.name}</Body> },
          { key: 'major', label: 'Major', minWidth: 110, render: (item) => <Body tone="secondary">{item.major_code}</Body> },
          { key: 'modules', label: 'Modules', minWidth: 100, render: (item) => <Body>{item.module_slots.length}</Body> },
          { key: 'status', label: 'Status', minWidth: 100, render: (item) => <Badge label={item.status} tone={item.status === 'ACTIVE' ? 'success' : item.status === 'DRAFT' ? 'info' : 'neutral'} /> },
        ]}
        renderCard={(item) => <RecordRow title={item.name} subtitle={`${item.major_code} · ${item.module_slots.length} module placements`} badge={<Badge label={item.status} tone={item.status === 'ACTIVE' ? 'success' : 'neutral'} />} onPress={() => setSelected(item)} />}
      />

      <Sheet title="New curriculum version" visible={creating} onDismiss={() => setCreating(false)} presentation="form">
        <Picker label="Major" loading={majors.loading} options={majorOptions} value={majorId || majorOptions[0]?.value || ''} onChange={setMajorId} />
        <Field label="Version name" placeholder="CS Curriculum 2027" value={name} onChangeText={setName} />
        <Button label="Create draft curriculum" loading={submit.pending} disabled={!name.trim() || !(majorId || majorOptions[0]?.value)} onPress={createCurriculum} />
      </Sheet>

      <Sheet title="New catalogue module" visible={catalogOpen} onDismiss={() => setCatalogOpen(false)} presentation="form">
        <Body tone="muted">Create the permanent identity once. It can then be placed in fixed programme semesters across curriculum versions.</Body>
        <Field label="Module code" autoCapitalize="characters" placeholder="CS101" value={moduleCode} onChangeText={setModuleCode} />
        <Field label="Module name" placeholder="Programming Fundamentals" value={moduleName} onChangeText={setModuleName} />
        <Button label="Create catalogue module" loading={submit.pending} disabled={!moduleCode.trim() || !moduleName.trim()} onPress={createDefinition} />
      </Sheet>

      <Sheet title={selected?.name ?? 'Curriculum'} visible={selected !== null} onDismiss={() => setSelected(null)} presentation="form">
        {selected ? (
          <View style={{ gap: 16 }}>
            <Card title="Module placements">
              {selected.module_slots.map((slot) => (
                <RecordRow
                  key={slot.id}
                  title={`${slot.module_code} — ${slot.module_name}`}
                  subtitle={`Semester ${slot.semester_number}`}
                  trailing={<Button label="Remove" variant="secondary" onPress={() => removeModule(slot.id)} />}
                />
              ))}
              {selected.module_slots.length === 0 ? <Body tone="muted">This curriculum has no modules yet.</Body> : null}
            </Card>
            <Card title="Add module placement">
              <Picker label="Catalogue module" loading={definitions.loading} options={definitionOptions} value={definitionId || definitionOptions[0]?.value || ''} onChange={setDefinitionId} />
              <Picker label="Programme semester" options={semesterOptions} value={String(semesterNumber)} onChange={(value) => setSemesterNumber(Number(value))} />
              <Button label="Add to curriculum" loading={submit.pending} disabled={!(definitionId || definitionOptions[0]?.value)} onPress={addModule} />
            </Card>
            <Card title="Open modules for teaching">
              <Body tone="muted">Choose the cohort&apos;s fixed programme semester and the dated period in which it will be taught. Existing assignments, enrolments, and results are preserved.</Body>
              <Picker label="Programme semester" options={semesterOptions} value={String(generationSemester)} onChange={(value) => setGenerationSemester(Number(value))} />
              <Picker label="Teaching period" loading={teachingPeriods.loading} options={periodOptions} value={generationPeriodId || activePeriodId} onChange={setGenerationPeriodId} />
              <Button label="Generate missing offerings" loading={submit.pending} disabled={!(generationPeriodId || activePeriodId)} onPress={generate} />
            </Card>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
