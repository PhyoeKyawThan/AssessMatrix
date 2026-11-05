import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EntityForm } from '@/shared/api/use-entity-form';
import { useResponsive } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import { ErrorBanner } from '@/shared/ui/error-banner';
import { Field } from '@/shared/ui/field';
import { Sheet } from '@/shared/ui/sheet';
import { Body } from '@/shared/ui/text';

interface FormSheetProps<D extends { id: string | null }> {
  title: string;
  form: EntityForm<D>;
  saveLabel?: string;
  hint?: string;
  deleteConfirmation?: { value: string; description: string };
  children: (draft: D, update: (patch: Partial<D>) => void) => ReactNode;
}

/** Sheet plus the banner/notice/save/delete scaffolding every resource form needs. */
export function FormSheet<D extends { id: string | null }>({
  title,
  form,
  saveLabel,
  hint,
  deleteConfirmation,
  children,
}: FormSheetProps<D>) {
  const layout = useResponsive();
  const editing = form.draft !== null && form.draft.id !== null;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const beginDelete = () => {
    setConfirmation('');
    setConfirmingDelete(true);
  };

  const destroy = async () => {
    await form.destroy();
    setConfirmingDelete(false);
    setConfirmation('');
  };

  const close = () => {
    setConfirmingDelete(false);
    setConfirmation('');
    form.close();
  };

  return (
    <Sheet title={title} visible={form.draft !== null} onDismiss={close}>
      {form.localErrors.length > 0 ? <ErrorBanner title="Check these fields" messages={form.localErrors} /> : null}
      {form.error !== null ? <ErrorBanner title="The API rejected this request" messages={form.error} /> : null}
      {form.notice !== null ? <Body tone="success">{form.notice}</Body> : null}
      {form.draft !== null && confirmingDelete && deleteConfirmation ? (
        <View style={{ gap: layout.gap }}>
          <Body>{deleteConfirmation.description}</Body>
          <Body tone="error">This action permanently removes related records and cannot be undone.</Body>
          <Field
            label={`Type ${deleteConfirmation.value} to confirm`}
            value={confirmation}
            autoCapitalize="none"
            onChangeText={setConfirmation}
          />
          <View style={styles.buttons}>
            <View style={styles.button}>
              <Button label="Cancel" variant="secondary" disabled={form.pending} onPress={() => setConfirmingDelete(false)} />
            </View>
            <View style={styles.button}>
              <Button
                label="Delete permanently"
                loading={form.pending}
                disabled={confirmation !== deleteConfirmation.value}
                onPress={destroy}
              />
            </View>
          </View>
        </View>
      ) : form.draft !== null ? (
        <View style={{ gap: layout.gap }}>
          {children(form.draft, form.update)}
          {hint !== undefined ? <Body tone="muted">{hint}</Body> : null}
          <View style={styles.buttons}>
            <View style={styles.button}>
              <Button
                label={saveLabel ?? (editing ? 'Save changes' : 'Create')}
                loading={form.pending}
                onPress={form.submit}
              />
            </View>
            {editing ? (
              <View style={styles.button}>
              <Button
                label="Delete"
                variant="secondary"
                disabled={form.pending}
                onPress={deleteConfirmation ? beginDelete : form.destroy}
              />
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  button: { flexGrow: 1, flexBasis: 150 },
});
