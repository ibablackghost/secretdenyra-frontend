import { useEffect } from 'react';
import { useCatalog } from '@/app/lib/useCatalog';
import { useCartStore } from '@/app/store/cartStore';
import { useToast } from '@/app/hooks/useToast';

/** Normalise les ids du panier persistant dès que le catalogue frais est chargé. */
export function useCartCatalogSync() {
  const { products, loading } = useCatalog();
  const reconcileWithCatalog = useCartStore((s) => s.reconcileWithCatalog);
  const { info } = useToast();

  useEffect(() => {
    if (loading || products.length === 0) return;
    const removed = reconcileWithCatalog(products);
    if (removed > 0) {
      info(
        removed === 1
          ? 'Un article obsolète a été retiré du panier (catalogue mis à jour).'
          : `${removed} articles obsolètes retirés du panier (catalogue mis à jour).`
      );
    }
  }, [products, loading, reconcileWithCatalog, info]);
}
