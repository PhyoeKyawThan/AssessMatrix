import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth';
import { markingApi, type ModuleResultSheet, type PeriodResultRow, type ResultSheetStatus } from '@/features/marking/api';
import { AppHeader } from '@/features/shell/components/app-header';
import { usePaged } from '@/shared/api/use-page';
import { useSubmit } from '@/shared/api/use-resource';
import { useI18n } from '@/shared/i18n';
import { Badge, Body, Button, EmptyState, ErrorBanner, Field, Pager, RecordRow, ResponsiveDataView, Screen, Sheet } from '@/shared/ui';

const statusTone: Record<ResultSheetStatus, 'neutral' | 'info' | 'warning' | 'success'> = {
  DRAFT: 'neutral', SUBMITTED: 'info', RETURNED: 'warning', VERIFIED: 'success', LOCKED: 'success',
};

export function PeriodResultsScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const list = usePaged<ModuleResultSheet>((page) => markingApi.sheets.list({ page, page_size: 25 }), []);
  const [selected, setSelected] = useState<ModuleResultSheet | null>(null);
  const [rows, setRows] = useState<PeriodResultRow[]>([]);
  const [returnComment, setReturnComment] = useState('');
  const submit = useSubmit();
  const teacherMode = user?.role === 'TEACHER';
  const editable = teacherMode && (selected?.status === 'DRAFT' || selected?.status === 'RETURNED');

  const open = (sheet: ModuleResultSheet) => {
    setSelected(sheet);
    setRows(sheet.roster ?? []);
    setReturnComment('');
    submit.reset();
    markingApi.sheets.get(sheet.id).then((detail) => {
      setSelected((current) => current?.id === detail.id ? detail : current);
      setRows(detail.roster);
    }).catch(() => undefined);
  };

  const updateRow = (enrollmentId: string, rawMark: string) => {
    setRows((current) => current.map((row) => (
      row.enrollment_id === enrollmentId ? { ...row, raw_mark: rawMark } : row
    )));
  };

  const closeAndReload = () => {
    setSelected(null);
    list.reload();
  };

  const saveMarks = async () => {
    if (selected === null) return;
    const completeRows = rows.filter((row) => row.raw_mark.trim() !== '');
    const ok = await submit.run(
      () => markingApi.sheets.saveMarks(selected.id, completeRows.map((row) => ({
        enrollment_id: row.enrollment_id,
        raw_mark: row.raw_mark,
        maximum_mark: row.maximum_mark,
        remark: row.remark,
      }))),
      'Raw marks saved.',
    );
    if (ok) {
      const refreshed = await markingApi.sheets.get(selected.id);
      setSelected(refreshed);
      setRows(refreshed.roster);
      list.reload();
    }
  };

  const transition = async (task: () => Promise<ModuleResultSheet>) => {
    const ok = await submit.run(task, 'Result sheet updated.');
    if (ok) closeAndReload();
  };

  const marked = useMemo(() => rows.filter((row) => row.raw_mark.trim() !== '').length, [rows]);

  return (
    <Screen scroll width="content">
      <AppHeader
        title={teacherMode ? t('results.rawMarksTitle') : t('results.reviewTitle')}
        subtitle={teacherMode ? t('results.rawMarksSubtitle') : t('results.reviewSubtitle')}
      />

      <ResponsiveDataView
        items={list.items}
        loading={list.loading}
        error={list.error}
        emptyMessage={t('results.noSheets')}
        onRetry={list.reload}
        keyExtractor={(sheet) => sheet.id}
        onRowPress={open}
        footer={<Pager page={list.page} pageCount={list.pageCount} onChange={list.setPage} disabled={list.loading} />}
        columns={[
          { key: 'module', label: t('results.module'), flex: 1.5, minWidth: 210, render: (sheet) => <Body>{sheet.module_code} — {sheet.module_name}</Body> },
          { key: 'period', label: t('results.academicPeriod'), minWidth: 170, render: (sheet) => <Body tone="secondary">{sheet.academic_year} · {sheet.semester_name}</Body> },
          { key: 'lecturer', label: t('results.lecturer'), minWidth: 150, render: (sheet) => <Body tone="secondary">{sheet.lecturer_name}</Body> },
          { key: 'completion', label: t('results.rawMark'), minWidth: 150, render: (sheet) => <Body>{t('results.studentsMarked', { marked: sheet.marked_count, enrolled: sheet.enrolled_count })}</Body> },
          { key: 'status', label: t('results.status'), minWidth: 110, render: (sheet) => <Badge label={t(`results.${sheet.status.toLowerCase()}`)} tone={statusTone[sheet.status]} /> },
        ]}
        renderCard={(sheet) => (
          <RecordRow
            title={`${sheet.module_code} — ${sheet.module_name}`}
            subtitle={`${sheet.academic_year} · ${sheet.semester_name} · ${t('results.studentsMarked', { marked: sheet.marked_count, enrolled: sheet.enrolled_count })}`}
            badge={<Badge label={t(`results.${sheet.status.toLowerCase()}`)} tone={statusTone[sheet.status]} />}
            onPress={() => open(sheet)}
          />
        )}
      />

      <Sheet
        title={selected === null ? t('results.rawMarksTitle') : `${selected.module_code} — ${selected.module_name}`}
        visible={selected !== null}
        onDismiss={() => setSelected(null)}
      >
        {selected === null ? null : (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 4 }}>
              <Badge label={t(`results.${selected.status.toLowerCase()}`)} tone={statusTone[selected.status]} />
              <Body tone="secondary">{selected.academic_year} · {selected.semester_name} · {selected.lecturer_name}</Body>
              <Body tone="muted">{t('results.studentsMarked', { marked, enrolled: rows.length })}</Body>
              {selected.returned_comment ? <Body tone="secondary">{selected.returned_comment}</Body> : null}
            </View>

            {submit.error ? <ErrorBanner title="Could not update result sheet" messages={submit.error} /> : null}
            {submit.notice ? <Body tone="success">{submit.notice}</Body> : null}

            {rows.length === 0 ? <EmptyState message={t('results.noSheets')} /> : rows.map((row) => (
              <View key={row.enrollment_id} style={{ gap: 6 }}>
                <Body>{row.student_number} · {row.student_name}</Body>
                <Field
                  label={t('results.rawMark')}
                  value={row.raw_mark}
                  editable={editable}
                  keyboardType="decimal-pad"
                  onChangeText={(value) => updateRow(row.enrollment_id, value)}
                />
              </View>
            ))}

            {editable ? (
              <>
                <Button label={t('common.save')} loading={submit.pending} onPress={saveMarks} />
                <Button
                  label={t('results.submit')}
                  variant="secondary"
                  disabled={marked !== rows.length || rows.length === 0}
                  loading={submit.pending}
                  onPress={() => transition(() => markingApi.sheets.submit(selected.id))}
                />
              </>
            ) : null}

            {!teacherMode && selected.status === 'SUBMITTED' ? (
              <>
                <Button label={t('results.verify')} loading={submit.pending} onPress={() => transition(() => markingApi.sheets.verify(selected.id))} />
                <Field label={t('results.return')} value={returnComment} onChangeText={setReturnComment} />
                <Button
                  label={t('results.return')}
                  variant="secondary"
                  disabled={!returnComment.trim()}
                  loading={submit.pending}
                  onPress={() => transition(() => markingApi.sheets.returnForRevision(selected.id, returnComment.trim()))}
                />
              </>
            ) : null}

            {!teacherMode && selected.status === 'VERIFIED' ? (
              <Button label={t('results.lock')} loading={submit.pending} onPress={() => transition(() => markingApi.sheets.lock(selected.id))} />
            ) : null}

            {user?.role === 'ADMIN' && selected.status === 'LOCKED' ? (
              <>
                <Field label={t('results.unlockReason')} value={returnComment} onChangeText={setReturnComment} />
                <Button
                  label={t('results.unlock')}
                  variant="secondary"
                  disabled={!returnComment.trim()}
                  loading={submit.pending}
                  onPress={() => transition(() => markingApi.sheets.unlock(selected.id, returnComment.trim()))}
                />
              </>
            ) : null}
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
