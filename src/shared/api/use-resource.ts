import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

import { ApiError } from '@/shared/api/types';

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ResourceState<T> {
  data: T | null;
  error: string[] | null;
  loading: boolean;
  reload: () => void;
}

/** `loader` may be a fresh closure each render; only `deps` re-runs the request. */
export function useResource<T>(loader: () => Promise<T>, deps: DependencyList): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);

  // The loader closure is refreshed after every render so a re-render never restarts the
  // request; only `deps` (or reload) do. This effect must stay above the fetching one.
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;
    // Fetching on mount/deps change has to announce itself, so the spinner is set here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    loaderRef
      .current()
      .then((value) => {
        if (!active) return;
        setData(value);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(describeError(caught));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, error, loading, reload };
}

export interface SubmitState {
  pending: boolean;
  error: string[] | null;
  notice: string | null;
  run: (task: () => Promise<unknown>, success?: string | ((result: unknown) => string)) => Promise<boolean>;
  reset: () => void;
}

/** One place to turn an `ApiError` body into the messages an `ErrorBanner` shows. */
export function useSubmit(): SubmitState {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = useCallback(
    async (task: () => Promise<unknown>, success?: string | ((result: unknown) => string)) => {
      setPending(true);
      setError(null);
      setNotice(null);
      try {
        const result = await task();
        setNotice(typeof success === 'function' ? success(result) : (success ?? 'Saved.'));
        return true;
      } catch (caught) {
        setError(describeError(caught));
        return false;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setPending(false);
    setError(null);
    setNotice(null);
  }, []);

  return { pending, error, notice, run, reset };
}

export function describeError(caught: unknown): string[] {
  if (caught instanceof ApiError) {
    const messages = [caught.message, ...caught.fieldErrors()];
    return [...new Set(messages.filter((message) => message !== ''))];
  }
  return [caught instanceof Error ? caught.message : String(caught)];
}
