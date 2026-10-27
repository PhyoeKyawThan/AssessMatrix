import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { EntityForm } from '@/shared/api/use-entity-form';
import { useResponsive } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import { ErrorBanner } from '@/shared/ui/error-banner';
import { Sheet } from '@/shared/ui/sheet';
import { Body } from '@/shared/ui/text';

interface FormSheetProps<D extends { id: string | null }> {
  title: string;
  form: EntityForm<D>;
  saveLabel?: string;
  hint?: string;
  children: (draft: D, update: (patch: Partial<D>) => void) => ReactNode;
}

/** Sheet plus the banner/notice/save/delete scaffolding every resource form needs. */
export function FormSheet<D extends { id: string | null }>({
  title,
  form,
  saveLabel,
  hint,
  children,
}: FormSheetProps<D>) {
  const layout = useResponsive();
  const editing = form.draft !== null && form.draft.id !== null;

  return (
    <Sheet title={title} visible={form.draft !== null} onDismiss={form.close}>
      {form.localErrors.length > 0 ? <ErrorBanner title="Check these fields" messages={form.localErrors} /> : null}
      {form.error !== null ? <ErrorBanner title="The API rejected this request" messages={form.error} /> : null}
      {form.notice !== null ? <Body tone="success">{form.notice}</Body> : null}
      {form.draft !== null ? (
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
                <Button label="Delete" variant="secondary" disabled={form.pending} onPress={form.destroy} />
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
