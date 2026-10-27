import { useCallback, useState, type DependencyList } from 'react';

import { useResource, type Page } from '@/shared/api/use-resource';

const DEFAULT_PAGE_SIZE = 20;

export interface PagedState<T> {
  items: T[];
  count: number;
  page: number;
  pageCount: number;
  loading: boolean;
  error: string[] | null;
  reload: () => void;
  setPage: (page: number) => void;
}

/** `build` may close over fresh values each render; `deps` decides when to refetch. */
export function usePaged<T>(build: (page: number) => Promise<Page<T>>, deps: DependencyList): PagedState<T> {
  const [page, setPage] = useState(1);
  const resource = useResource(() => build(page), [...deps, page]);
  const data = resource.data;
  const size = data !== null && data.results.length > 0 ? data.results.length : DEFAULT_PAGE_SIZE;
  const count = data?.count ?? 0;

  const goToPage = useCallback((next: number) => {
    setPage(Math.max(1, next));
  }, []);

  return {
    items: data?.results ?? [],
    count,
    page,
    pageCount: Math.max(1, Math.ceil(count / size)),
    loading: resource.loading,
    error: resource.error,
    reload: resource.reload,
    setPage: goToPage,
  };
}
