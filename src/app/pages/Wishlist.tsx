import { Link } from 'react-router';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useCatalog } from '../lib/useCatalog';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { ProductCard } from '../features/catalog/components/ProductCard';
import { useToast } from '../hooks/useToast';
import type { UIProduct } from '../features/catalog/types';
import { trackAddToCart } from '../services/analytics/tracking';
import {
  checkoutProductRef,
  checkoutVariantRef,
  getDefaultVariant,
  unitPriceForLine,
  variantLineId,
} from '../features/catalog/productUtils';

export const Wishlist = () => {
  const ids = useWishlistStore((s) => s.ids);
  const toggle = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);
  const { products, loading, error } = useCatalog();
  const { success, info } = useToast();

  const wishProducts = products.filter((p) => ids.includes(p.id) || ids.includes(p.slug));

  const handleAddToCart = (product: UIProduct) => {
    const def = getDefaultVariant(product);
    const variantId = def ? checkoutVariantRef(product, variantLineId(def)) : undefined;
    void addItem(checkoutProductRef(product), { variantId, quantity: 1 });
    trackAddToCart({ ...product, price: unitPriceForLine(product, variantId) }, 1);
    success(`Ajouté au panier: ${product.name}`);
  };

  const handleToggleWishlist = (product: UIProduct, wished: boolean) => {
    toggle(product.id);
    info(wished ? `Retiré des favoris: ${product.name}` : `Ajouté aux favoris: ${product.name}`);
  };

  if (loading) {
    return <LoadingState message="Chargement des favoris..." className="mx-auto max-w-[1400px] px-4 md:py-16" />;
  }

  if (error) {
    return <ErrorState message={error} className="mx-auto max-w-[1400px] px-4 md:py-16" />;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:py-16">
      <nav className="mb-8 text-sm text-gray-500 font-['Mulish',sans-serif]">
        <Link to="/" className="hover:text-[#1a1a1a]">
          Accueil
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-[#1a1a1a] font-medium">Liste de souhaits</span>
      </nav>

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-['Mulish',sans-serif] text-3xl font-bold text-[#1a1a1a]">
            Liste de souhaits
          </h1>
          <p className="mt-2 text-gray-600 font-['Mulish',sans-serif] text-sm">
            {wishProducts.length} article{wishProducts.length !== 1 ? 's' : ''} enregistré
            {wishProducts.length !== 1 ? 's' : ''} sur cet appareil.
          </p>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center rounded-full border-2 border-[#1a1a1a] px-8 py-3.5 font-['Mulish',sans-serif] text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#fafafa]"
        >
          Découvrir la boutique
        </Link>
      </div>

      {wishProducts.length === 0 ? (
        <EmptyState
          className="rounded-[16px] border border-dashed border-gray-200 bg-[#fafafa] py-24 px-6"
          title="Votre liste est vide"
          description="Cliquez sur le cœur sur une fiche produit ou dans la grille pour ajouter vos infusions préférées."
          action={
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-full bg-[#a4a374] px-8 py-3.5 font-['Mulish',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#8d8c5d]"
            >
              Voir les produits
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {wishProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              wished
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};
