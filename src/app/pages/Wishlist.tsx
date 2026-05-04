import { Link } from 'react-router';
import { Heart, Star } from 'lucide-react';
import { products, formatPrice } from '../data';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
export const Wishlist = () => {
  const ids = useWishlistStore((s) => s.ids);
  const toggle = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);

  const wishProducts = products.filter((p) => ids.includes(p.id));

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
        <div className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-gray-200 bg-[#fafafa] py-24 px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <Heart className="h-8 w-8 text-[#a4a374]" />
          </div>
          <h2 className="font-['Mulish',sans-serif] text-xl font-semibold text-[#303030]">
            Votre liste est vide
          </h2>
          <p className="mt-2 max-w-md text-sm text-gray-500 font-['Mulish',sans-serif]">
            Cliquez sur le cœur sur une fiche produit ou dans la grille pour ajouter vos infusions préférées.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#a4a374] px-8 py-3.5 font-['Mulish',sans-serif] text-sm font-semibold text-white transition-colors hover:bg-[#8d8c5d]"
          >
            Voir les produits
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {wishProducts.map((product) => (
            <div key={product.id} className="group flex flex-col gap-4">
              <Link
                to={`/product/${product.id}`}
                className={`relative ${product.bgClass} aspect-[4/5] overflow-hidden rounded-[10px] p-4 transition-transform group-hover:scale-[1.02]`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle(product.id);
                  }}
                  className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm transition-colors hover:bg-white"
                  aria-label="Retirer des favoris"
                >
                  <Heart className="h-5 w-5 fill-current" />
                </button>
                <div className="absolute left-4 top-4 flex items-center gap-1 rounded-[4px] bg-white/80 px-2 py-1 backdrop-blur-sm">
                  <Star className="h-3 w-3 fill-current text-black" />
                  <span className="text-xs font-bold">{product.rating}</span>
                </div>
                <img
                  src={product.image}
                  alt={product.name}
                  className="mx-auto h-auto w-[80%] object-contain drop-shadow-md"
                />
              </Link>
              <div>
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-medium text-[#1a1a1a] transition-colors group-hover:text-[#a4a374]">
                    {product.name}
                  </h3>
                </Link>
                <p className="truncate text-xs text-gray-500">{product.ingredients}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold text-[#303030]">{formatPrice(product.price)}</span>
                  <button
                    type="button"
                    onClick={() => addItem(product.id)}
                    className="rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#a4a374]"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
