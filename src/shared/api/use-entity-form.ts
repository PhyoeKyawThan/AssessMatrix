import { useCallback, useMemo, useState } from 'react';

import { useSubmit } from '@/shared/api/use-resource';
import { errorMessages } from '@/shared/utils/format';

export interface EntityFormConfig<D extends { id: string | null }> {
  blank: D;
  validate: (draft: D) => Record<string, string | null>;
  save: (draft: D) => Promise<unknown>;
  remove?: (id: string) => Promise<unknown>;
  onSaved: (created: boolean) => void;
}

export interface EntityForm<D> {
  draft: D | null;
  problems: Record<string, string | null>;
  localErrors: string[];
  pending: boolean;
  error: string[] | null;
  notice: string | null;
  open: (draft?: D) => void;
  close: () => void;
  update: (patch: Partial<D>) => void;
  submit: () => Promise<void>;
  destroy: () => Promise<void>;
}

/** Draft state, local validation and the API call for the create/edit sheets. */
export function useEntityForm<D extends { id: string | null }>(config: EntityFormConfig<D>): EntityForm<D> {
  const [draft, setDraft] = useState<D | null>(null);
  const [localErrors, setLocalErrors] = useState<string[]>([]);
  const submit = useSubmit();

  const problems = useMemo(
    () => (draft === null ? {} : config.validate(draft)),
    [config, draft],
  );

  const open = useCallback(
    (value?: D) => {
      submit.reset();
      setLocalErrors([]);
      setDraft(value ?? config.blank);
    },
    [config.blank, submit],
  );

  const close = useCallback(() => setDraft(null), []);

  const update = useCallback((patch: Partial<D>) => {
    setDraft((current) => (current === null ? current : { ...current, ...patch }));
  }, []);

  const persist = useCallback(async () => {
    if (draft === null) return;
    const messages = errorMessages(problems);
    if (messages.length > 0) {
      setLocalErrors(messages);
      return;
    }
    setLocalErrors([]);
    const created = draft.id === null;
    const ok = await submit.run(
      () => config.save(draft),
      created ? 'Created.' : 'Saved.',
    );
    if (ok) {
      setDraft(null);
      config.onSaved(created);
    }
  }, [config, draft, problems, submit]);

  const destroy = useCallback(async () => {
    const remover = config.remove;
    if (draft?.id === undefined || draft?.id === null || remover === undefined) return;
    const id = draft.id;
    const ok = await submit.run(() => remover(id), 'Deleted.');
    if (ok) {
      setDraft(null);
      config.onSaved(false);
    }
  }, [config, draft, submit]);

  return {
    draft,
    problems,
    localErrors,
    pending: submit.pending,
    error: submit.error,
    notice: submit.notice,
    open,
    close,
    update,
    submit: persist,
    destroy,
  };
}
