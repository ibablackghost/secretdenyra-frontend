import { useCallback, useMemo } from 'react';
import { fetchCatalog } from '@/app/services/api/catalogApi';
import type { CatalogPayload } from '@/app/features/catalog/types';
import { localizeCatalog } from '@/app/i18n/catalogLocalize';
import { useLocaleStore } from '@/app/store/localeStore';
import { useAsyncResource } from './useAsyncResource';

const EMPTY_CATALOG: CatalogPayload = {
  products: [],
  categories: [],
  tags: [],
};

export function useCatalog() {
  const locale = useLocaleStore((s) => s.locale);
  const load = useCallback((signal: AbortSignal) => fetchCatalog(signal), []);
  const initial = useMemo(() => EMPTY_CATALOG, []);
  const state = useAsyncResource<CatalogPayload>(load, initial);

  const localized = useMemo(() => localizeCatalog(state.data, locale), [state.data, locale]);

  return {
    products: localized.products,
    categories: localized.categories,
    tags: localized.tags,
    loading: state.loading,
    error: state.error,
    status: state.status,
  };
}
