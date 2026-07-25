import { Link } from 'react-router';
import { ShoppingBag, X } from 'lucide-react';
import { useCartAddedBarStore } from '@/app/store/cartAddedBarStore';

export function CartAddedBar() {
  const visible = useCartAddedBarStore((s) => s.visible);
  const productName = useCartAddedBarStore((s) => s.productName);
  const hide = useCartAddedBarStore((s) => s.hide);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 pt-2 sm:px-6"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-[#a4a374]/40 bg-[#1a1a1a] px-4 py-3 text-white shadow-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#a4a374]/20">
          <ShoppingBag className="h-5 w-5 text-[#c5c49a]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/80">
            {productName ? `${productName} ajouté` : 'Produit ajouté au panier'}
          </p>
          <Link
            to="/cart"
            onClick={() => hide()}
            className="mt-0.5 inline-flex items-center text-sm font-bold uppercase tracking-wide text-[#c5c49a] underline-offset-2 hover:underline"
          >
            Voir panier
          </Link>
        </div>
        <button
          type="button"
          onClick={() => hide()}
          className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
