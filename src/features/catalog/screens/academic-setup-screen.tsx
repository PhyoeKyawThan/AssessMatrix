import { useState } from 'react';
import { View } from 'react-native';

import { setupApi, type AcademicSetupData, type AcademicSetupDraft } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { usePaged } from '@/shared/api/use-page';
import { useSubmit } from '@/shared/api/use-resource';
import { Body, Button, Card, CheckRow, DateField, ErrorBanner, Field, OptionChips, RecordRow, Screen, SectionTitle } from '@/shared/ui';

const EMPTY_SETUP: AcademicSetupData = {
  academic: { academic_year: '', start_date: '', end_date: '' },
  semesters: [
    { semester_no: 1, semester_name: 'Semester 1', start_date: '', end_date: '' },
    { semester_no: 2, semester_name: 'Semester 2', start_date: '', end_date: '' },
  ],
  majors: [],
  modules: [],
};

const STEPS = [
  { value: '1', label: '1. Academic year' },
  { value: '2', label: '2. Semesters' },
  { value: '3', label: '3. Majors' },
  { value: '4', label: '4. Modules & review' },
];

export function AcademicSetupScreen() {
  const drafts = usePaged<AcademicSetupDraft>((page) => setupApi.list(page), []);
  const submit = useSubmit();
  const [draft, setDraft] = useState<AcademicSetupDraft | null>(null);
  const [data, setData] = useState<AcademicSetupData>(EMPTY_SETUP);

  const openDraft = (next: AcademicSetupDraft) => {
    setDraft(next);
    setData({ ...EMPTY_SETUP, ...next.data });
    submit.reset();
  };

  const createDraft = async () => {
    let created: AcademicSetupDraft | null = null;
    const ok = await submit.run(async () => {
      created = await setupApi.create({ name: 'New academic setup', current_step: 1, data: EMPTY_SETUP });
      return created;
    }, 'Draft started.');
    if (ok && created) {
      openDraft(created);
      drafts.reload();
    }
  };

  const saveAtStep = async (targetStep: number) => {
    if (!draft) return false;
    let saved: AcademicSetupDraft | null = null;
    const name = data.academic?.academic_year ? `${data.academic.academic_year} academic setup` : draft.name;
    const ok = await submit.run(async () => {
      saved = await setupApi.update(draft.id, { name, current_step: targetStep, data });
      return saved;
    }, 'Draft saved.');
    if (ok && saved) {
      setDraft(saved);
      drafts.reload();
    }
    return ok;
  };

  const publish = async () => {
    if (!draft) return;
    const ok = await submit.run(() => setupApi.publish(draft.id), 'Academic setup published.');
    if (ok) {
      setDraft(null);
      setData(EMPTY_SETUP);
      drafts.reload();
    }
  };

  if (!draft) {
    return (
      <Screen scroll width="content">
        <AppHeader
          title="Academic setup"
          subtitle="Prepare a complete year privately, move backward or forward at any time, then publish it to the live database in one operation."
          actions={<Button label="Start setup" loading={submit.pending} onPress={createDraft} />}
        />
        {submit.error ? <ErrorBanner title="Could not start setup" messages={submit.error} /> : null}
        {submit.notice ? <Card><Body>{submit.notice}</Body></Card> : null}
        <Card title="Setup drafts">
          <Body tone="muted">Drafts do not affect current academics, semesters, majors, or modules until they are published.</Body>
          {drafts.items.filter((item) => item.status === 'DRAFT').map((item) => (
            <RecordRow
              key={item.id}
              title={item.name}
              subtitle={`Step ${item.current_step} of 4 · Last saved ${new Date(item.updated_at).toLocaleDateString()}`}
              onPress={() => openDraft(item)}
            />
          ))}
          {!drafts.loading && drafts.items.filter((item) => item.status === 'DRAFT').length === 0 ? <Body tone="muted">No unfinished setup drafts.</Body> : null}
        </Card>
      </Screen>
    );
  }

  const step = draft.current_step;
  const majors = data.majors ?? [];
  const modules = data.modules ?? [];

  return (
    <Screen scroll width="content">
      <AppHeader
        title={data.academic?.academic_year || 'New academic setup'}
        subtitle="Nothing becomes live until the final Publish action succeeds."
        actions={<Button label="Save & exit" variant="secondary" loading={submit.pending} onPress={async () => { if (await saveAtStep(step)) setDraft(null); }} />}
      />

      <Card>
        <OptionChips value={String(step)} onChange={(value) => saveAtStep(Number(value))} options={STEPS} />
      </Card>
      {submit.error ? <ErrorBanner title="Could not save this setup" messages={submit.error} /> : null}
      {submit.notice ? <Body tone="muted">{submit.notice}</Body> : null}

      {step === 1 ? (
        <Card title="Academic year">
          <Body tone="muted">Use the full academic label and its overall date range.</Body>
          <Field label="Academic year" placeholder="2026-2027" value={data.academic?.academic_year ?? ''} onChangeText={(academic_year) => setData((value) => ({ ...value, academic: { ...(value.academic ?? { start_date: '', end_date: '' }), academic_year } }))} />
          <DateField label="Start date" value={data.academic?.start_date ?? ''} onChange={(start_date) => setData((value) => ({ ...value, academic: { ...(value.academic ?? { academic_year: '', end_date: '' }), start_date } }))} />
          <DateField label="End date" value={data.academic?.end_date ?? ''} minimumDate={data.academic?.start_date || undefined} onChange={(end_date) => setData((value) => ({ ...value, academic: { ...(value.academic ?? { academic_year: '', start_date: '' }), end_date } }))} />
        </Card>
      ) : null}

      {step === 2 ? (
        <Card title="Two semesters">
          <Body tone="muted">Every academic year has Semester 1 and Semester 2. Their dates must remain inside the academic-year range.</Body>
          {(data.semesters ?? EMPTY_SETUP.semesters ?? []).map((semester, index) => (
            <Card key={semester.semester_no} title={`Semester ${semester.semester_no}`}>
              <Field label="Name" value={semester.semester_name} onChangeText={(semester_name) => setData((value) => ({ ...value, semesters: (value.semesters ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, semester_name } : item) }))} />
              <DateField label="Start date" value={semester.start_date} minimumDate={data.academic?.start_date} maximumDate={data.academic?.end_date} onChange={(start_date) => setData((value) => ({ ...value, semesters: (value.semesters ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, start_date } : item) }))} />
              <DateField label="End date" value={semester.end_date} minimumDate={semester.start_date || data.academic?.start_date} maximumDate={data.academic?.end_date} onChange={(end_date) => setData((value) => ({ ...value, semesters: (value.semesters ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, end_date } : item) }))} />
            </Card>
          ))}
        </Card>
      ) : null}

      {step === 3 ? (
        <Card title="Majors and duration" actions={<Button label="Add major" variant="secondary" onPress={() => setData((value) => ({ ...value, majors: [...(value.majors ?? []), { code: '', name: '', duration_years: 4 }] }))} />}>
          <Body tone="muted">A four-year major has 8 study semesters; a five-year major has 10.</Body>
          {majors.map((major, index) => (
            <Card key={`${index}-${major.code}`} title={`Major ${index + 1}`} actions={<Button label="Remove" variant="secondary" onPress={() => setData((value) => ({ ...value, majors: (value.majors ?? []).filter((_, itemIndex) => itemIndex !== index) }))} />}>
              <Field label="Code" placeholder="CS" autoCapitalize="characters" value={major.code} onChangeText={(code) => setData((value) => ({ ...value, majors: (value.majors ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, code } : item) }))} />
              <Field label="Name" placeholder="Computer Science" value={major.name} onChangeText={(name) => setData((value) => ({ ...value, majors: (value.majors ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, name } : item) }))} />
              <OptionChips label="Programme duration" value={String(major.duration_years)} onChange={(duration) => setData((value) => ({ ...value, majors: (value.majors ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, duration_years: Number(duration) as 4 | 5 } : item) }))} options={[{ value: '4', label: '4 years · 8 semesters' }, { value: '5', label: '5 years · 10 semesters' }]} />
            </Card>
          ))}
          {majors.length === 0 ? <Body tone="muted">Add at least one major before publishing.</Body> : null}
        </Card>
      ) : null}

      {step === 4 ? (
        <>
          <Card title="Modules" actions={<Button label="Add module" variant="secondary" onPress={() => setData((value) => ({ ...value, modules: [...(value.modules ?? []), { module_code: '', module_name: '', study_year: 1, semester_no: 1, major_codes: [] }] }))} />}>
            <Body tone="muted">Place each module in a study year and Semester 1 or 2. Select majors when programmes differ in the same semester.</Body>
            {modules.map((module, index) => (
              <Card key={`${index}-${module.module_code}`} title={`Module ${index + 1}`} actions={<Button label="Remove" variant="secondary" onPress={() => setData((value) => ({ ...value, modules: (value.modules ?? []).filter((_, itemIndex) => itemIndex !== index) }))} />}>
                <Field label="Code" placeholder="CS101" autoCapitalize="characters" value={module.module_code} onChangeText={(module_code) => setData((value) => ({ ...value, modules: (value.modules ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, module_code } : item) }))} />
                <Field label="Name" placeholder="Programming Fundamentals" value={module.module_name} onChangeText={(module_name) => setData((value) => ({ ...value, modules: (value.modules ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, module_name } : item) }))} />
                <OptionChips label="Study year" value={String(module.study_year)} onChange={(studyYear) => setData((value) => ({ ...value, modules: (value.modules ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, study_year: Number(studyYear) } : item) }))} options={[1, 2, 3, 4, 5].map((year) => ({ value: String(year), label: `Year ${year}` }))} />
                <OptionChips label="Semester" value={String(module.semester_no)} onChange={(semesterNo) => setData((value) => ({ ...value, modules: (value.modules ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, semester_no: Number(semesterNo) as 1 | 2 } : item) }))} options={[{ value: '1', label: 'Semester 1' }, { value: '2', label: 'Semester 2' }]} />
                <SectionTitle>Available to majors</SectionTitle>
                <Body tone="muted">Leave all unchecked when the module is shared by every major.</Body>
                {majors.map((major) => <CheckRow key={major.code} title={`${major.code} — ${major.name}`} checked={module.major_codes.includes(major.code)} onToggle={() => setData((value) => ({ ...value, modules: (value.modules ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, major_codes: item.major_codes.includes(major.code) ? item.major_codes.filter((code) => code !== major.code) : [...item.major_codes, major.code] } : item) }))} />)}
              </Card>
            ))}
            {modules.length === 0 ? <Body tone="muted">Add the modules for this academic year.</Body> : null}
          </Card>
          <Card title="Review before publishing">
            <Body>{data.academic?.academic_year || 'Academic year missing'} · 2 semesters</Body>
            <Body>{majors.length} majors · {modules.length} modules</Body>
            <Body tone="muted">Publishing is atomic: if any item is invalid, none of the live records will be created.</Body>
            <Button label="Publish academic setup" loading={submit.pending} onPress={publish} />
          </Card>
        </>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <Button label="Back" variant="secondary" disabled={step === 1 || submit.pending} onPress={() => saveAtStep(Math.max(1, step - 1))} />
        {step < 4 ? <Button label="Save & continue" loading={submit.pending} onPress={() => saveAtStep(step + 1)} /> : null}
      </View>
    </Screen>
  );
}
