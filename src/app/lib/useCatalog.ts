import { useEffect, useState } from 'react';
import { CatalogPayload, fetchCatalog } from './catalog';

type CatalogState = CatalogPayload & {
  loading: boolean;
  error: string | null;
};

const initialState: CatalogState = {
  products: [],
  categories: [],
  loading: true,
  error: null,
};

export function useCatalog() {
  const [state, setState] = useState<CatalogState>(initialState);

  useEffect(() => {
    let mounted = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchCatalog()
      .then(({ products, categories }) => {
        if (!mounted) return;
        setState({ products, categories, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setState({
          products: [],
          categories: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue.',
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
