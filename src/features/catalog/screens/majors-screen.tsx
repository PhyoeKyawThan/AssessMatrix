import { useState } from 'react';
import { View } from 'react-native';

import { catalogApi, type Major } from '@/features/catalog/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { usePaged } from '@/shared/api/use-page';
import { useSubmit } from '@/shared/api/use-resource';
import { Badge, Body, Button, ErrorBanner, Field, OptionChips, Pager, RecordRow, ResponsiveDataView, Screen, Sheet } from '@/shared/ui';

type Draft = Omit<Major, 'id'> & { id: string | null };

export function MajorsScreen() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const list = usePaged<Major>((page) => catalogApi.majors.list({ page, page_size: 50 }), []);
  const submit = useSubmit();

  const save = async () => {
    if (draft === null) return;
    const body = { code: draft.code.trim().toUpperCase(), name: draft.name.trim(), duration_years: draft.duration_years, is_active: draft.is_active };
    const ok = await submit.run(
      () => draft.id === null ? catalogApi.majors.create(body) : catalogApi.majors.update(draft.id, body),
      draft.id === null ? 'Major created.' : 'Major updated.',
    );
    if (ok) {
      setDraft(null);
      list.reload();
    }
  };

  return (
    <Screen scroll>
      <AppHeader
        title="Majors"
        subtitle="Majors control which module offerings are available to each student cohort."
        actions={<Button label="New major" onPress={() => setDraft({ id: null, code: '', name: '', duration_years: 4, is_active: true })} />}
      />
      <ResponsiveDataView
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage="No majors have been configured."
        onRetry={list.reload}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        keyExtractor={(major) => major.id}
        onRowPress={(major) => setDraft({ ...major })}
        columns={[
          { key: 'code', label: 'Code', minWidth: 100, flex: 0.7, render: (major) => <Body>{major.code}</Body> },
          { key: 'name', label: 'Major', minWidth: 220, flex: 1.8, render: (major) => <Body>{major.name}</Body> },
          { key: 'duration', label: 'Duration', minWidth: 120, render: (major) => <Body tone="secondary">{major.duration_years} years</Body> },
          { key: 'semesters', label: 'Study semesters', minWidth: 120, render: (major) => <Body tone="secondary">{major.duration_years * 2}</Body> },
          { key: 'status', label: 'Status', minWidth: 100, render: (major) => <Badge label={major.is_active ? 'Active' : 'Inactive'} tone={major.is_active ? 'success' : 'neutral'} /> },
        ]}
        renderCard={(major) => (
          <RecordRow
            title={`${major.code} — ${major.name}`}
            subtitle={`${major.duration_years}-year programme · ${major.duration_years * 2} semesters`}
            badge={<Badge label={major.is_active ? 'Active' : 'Inactive'} tone={major.is_active ? 'success' : 'neutral'} />}
            onPress={() => setDraft({ ...major })}
          />
        )}
      />
      <Sheet title={draft?.id === null ? 'New major' : 'Edit major'} visible={draft !== null} onDismiss={() => setDraft(null)}>
        {submit.error ? <ErrorBanner title="Could not save major" messages={submit.error} /> : null}
        {draft ? (
          <View style={{ gap: 16 }}>
            <Field label="Major code" value={draft.code} autoCapitalize="characters" placeholder="CS" onChangeText={(code) => setDraft({ ...draft, code })} />
            <Field label="Major name" value={draft.name} placeholder="Computer Science" onChangeText={(name) => setDraft({ ...draft, name })} />
            <OptionChips
              label="Programme duration"
              value={String(draft.duration_years)}
              onChange={(value) => setDraft({ ...draft, duration_years: Number(value) as 4 | 5 })}
              options={[{ value: '4', label: '4 years' }, { value: '5', label: '5 years' }]}
            />
            <OptionChips
              label="Status"
              value={draft.is_active ? 'ACTIVE' : 'INACTIVE'}
              onChange={(value) => setDraft({ ...draft, is_active: value === 'ACTIVE' })}
              options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
            />
            <Body tone="muted">Deactivate a historical major instead of deleting it.</Body>
            <Button label="Save major" loading={submit.pending} disabled={!draft.code.trim() || !draft.name.trim()} onPress={save} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
