import { useCallback, useMemo } from 'react';
import { fetchCatalog } from '@/app/services/api/catalogApi';
import type { CatalogPayload } from '@/app/features/catalog/types';
import { useAsyncResource } from './useAsyncResource';

const EMPTY_CATALOG: CatalogPayload = {
  products: [],
  categories: [],
  tags: [],
};

export function useCatalog() {
  const load = useCallback((signal: AbortSignal) => fetchCatalog(signal), []);
  const initial = useMemo(() => EMPTY_CATALOG, []);
  const state = useAsyncResource<CatalogPayload>(load, initial);

  return {
    products: state.data.products,
    categories: state.data.categories,
    tags: state.data.tags,
    loading: state.loading,
    error: state.error,
    status: state.status,
  };
}
