import { memo } from 'react';
import { Link } from 'react-router';
import { Heart, Star } from 'lucide-react';
import type { UIProduct } from '../types';
import { formatPrice } from '@/app/lib/price';
import { MediaImage } from '@/app/components/ui/MediaImage';

type ProductCardProps = {
  product: UIProduct;
  wished: boolean;
  onToggleWishlist: (product: UIProduct, wished: boolean) => void;
  onAddToCart: (product: UIProduct) => void;
};

function ProductCardBase({ product, wished, onToggleWishlist, onAddToCart }: ProductCardProps) {
  const hasPromo = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const isOutOfStock = product.inStock === false || (typeof product.stockQty === 'number' && product.stockQty <= 0);

  return (
    <div className="group flex flex-col gap-4">
      <div className={`relative ${product.bgClass} aspect-[4/5] overflow-hidden rounded-[10px] transition-transform group-hover:scale-[1.02]`}>
        <Link to={`/product/${product.slug}`} className="absolute inset-0 flex items-center justify-center p-4">
          <div className="absolute left-4 top-4 z-[1] flex items-center gap-1 rounded-[4px] bg-white/80 px-2 py-1 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-current text-black" />
            <span className="text-xs font-bold">{product.rating}</span>
            <span className="text-xs text-gray-500">({product.reviews})</span>
          </div>
          {hasPromo ? (
            <span className="absolute left-4 top-14 z-[1] rounded-full bg-[#c45c5c] px-2 py-1 text-[10px] font-bold text-white">
              Promo
            </span>
          ) : null}
          {isOutOfStock ? (
            <span className="absolute left-4 bottom-4 z-[1] rounded-full bg-black/80 px-2 py-1 text-[10px] font-semibold text-white">
              Rupture
            </span>
          ) : null}
          <MediaImage
            src={product.image}
            alt={product.name}
            className="relative z-0 h-auto w-[80%] object-contain drop-shadow-md"
            fallbackClassName="relative z-0 h-[70%] w-[80%]"
          />
        </Link>
        <button
          type="button"
          aria-label={wished ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute right-4 top-4 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition-colors hover:bg-white"
          onClick={(e) => {
            e.preventDefault();
              onToggleWishlist(product, wished);
          }}
        >
          <Heart className={`h-5 w-5 ${wished ? 'fill-[#c45c5c] text-[#c45c5c]' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-medium text-[#1a1a1a] group-hover:text-[#a4a374] transition-colors">{product.name}</h3>
          <p className="text-xs text-gray-500 truncate">{product.ingredients}</p>
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#303030]">{formatPrice(product.price)}</span>
            {hasPromo ? <span className="text-xs text-gray-400 line-through">{formatPrice(product.compareAtPrice!)}</span> : null}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            className="h-8 w-8 cursor-pointer rounded-full bg-[#1a1a1a] flex items-center justify-center transition-colors hover:bg-[#a4a374]"
            aria-label="Add to cart"
            disabled={isOutOfStock}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1V15M1 8H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardBase);
