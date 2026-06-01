import { useEffect, useRef } from 'react';
import { useCatalog } from '@/app/lib/useCatalog';
import { useCartStore } from '@/app/store/cartStore';
import { useToast } from '@/app/hooks/useToast';

/**
 * Normalise le panier persistant une fois le catalogue chargé.
 * Uniquement sur les pages qui appellent ce hook (pas de sync globale).
 */
export function useReconcileCartWhenReady(notify = false) {
  const { products, loading } = useCatalog();
  const reconcileWithCatalog = useCartStore((s) => s.reconcileWithCatalog);
  const { info } = useToast();
  const ranRef = useRef(false);

  useEffect(() => {
    if (loading || products.length === 0 || ranRef.current) return;
    ranRef.current = true;
    const removed = reconcileWithCatalog(products);
    if (notify && removed > 0) {
      info(
        removed === 1
          ? 'Un article obsolète a été retiré du panier.'
          : `${removed} articles obsolètes retirés du panier.`
      );
    }
  }, [loading, products, reconcileWithCatalog, notify, info]);
}
