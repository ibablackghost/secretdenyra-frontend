import { memo } from 'react';
import { Link } from 'react-router';
import { Heart, Star } from 'lucide-react';
import type { UIProduct } from '../types';
import { formatPrice } from '@/app/lib/price';
import { getCatalogListPrice } from '../productUtils';
import { MediaImage } from '@/app/components/ui/MediaImage';
import { useHerboristeriePriceAccess } from '@/app/hooks/useHerboristeriePriceAccess';
import { ProfessionalPriceHint } from '@/app/components/catalog/ProfessionalPriceHint';
import { useToast } from '@/app/hooks/useToast';

type ProductCardProps = {
  product: UIProduct;
  wished: boolean;
  onToggleWishlist: (product: UIProduct, wished: boolean) => void;
  onAddToCart: (product: UIProduct) => void;
};

function ProductCardBase({ product, wished, onToggleWishlist, onAddToCart }: ProductCardProps) {
  const { shouldHidePrice, canPurchaseProduct } = useHerboristeriePriceAccess();
  const { info } = useToast();
  const hidePrice = shouldHidePrice(product);
  const canPurchase = canPurchaseProduct(product);
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const listPrice = getCatalogListPrice(product);
  const hasPromo = Boolean(product.compareAtPrice && product.compareAtPrice > listPrice);
  const anyVariantBuyable = hasVariants
    ? product.variants.some((v) => v.inStock !== false && (v.stockQty === undefined || (v.stockQty ?? 0) > 0))
    : true;
  const isOutOfStock = !anyVariantBuyable;

  return (
    <div className="group flex flex-col gap-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] bg-white transition-transform group-hover:scale-[1.02]">
        <Link to={`/product/${product.slug}`} className="absolute inset-0 flex flex-col items-stretch justify-between p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex max-w-[70%] flex-wrap items-center gap-1">
              <span className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-700 backdrop-blur-sm">
                {product.category.name}
              </span>
              {product.tags.slice(0, 2).map((tag) => (
                <span key={tag.slug} className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-[4px] bg-white/80 px-2 py-1 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-current text-black" />
              <span className="text-xs font-bold">{product.rating}</span>
              <span className="text-xs text-gray-500">({product.reviews})</span>
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-2 pb-10 pt-2">
            {hasPromo ? (
              <span className="mb-2 self-start rounded-full bg-[#c45c5c] px-2 py-1 text-[10px] font-bold text-white">Promo</span>
            ) : null}
            {isOutOfStock ? (
              <span className="mb-2 self-start rounded-full bg-black/80 px-2 py-1 text-[10px] font-semibold text-white">Rupture</span>
            ) : null}
            <MediaImage
              src={product.image}
              alt={product.name}
              className="relative z-0 h-auto w-[80%] object-contain drop-shadow-md"
              fallbackClassName="relative z-0 h-[70%] w-[80%]"
            />
          </div>
        </Link>
        <button
          type="button"
          aria-label={wished ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute right-4 top-14 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition-colors hover:bg-white"
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
          <h3 className="font-medium text-[#1a1a1a] transition-colors group-hover:text-[#a4a374]">{product.name}</h3>
          <p className="truncate text-xs text-gray-500">{product.shortDescription?.trim() || product.ingredients}</p>
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            {hidePrice ? (
              <ProfessionalPriceHint compact />
            ) : (
              <>
                {hasVariants ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">À partir de</span>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#303030]">{formatPrice(listPrice)}</span>
                  {hasPromo ? (
                    <span className="text-xs text-gray-400 line-through">{formatPrice(product.compareAtPrice!)}</span>
                  ) : null}
                </div>
                {hasVariants && typeof product.stockQty === 'number' ? (
                  <span className="text-[10px] text-gray-500">Stock indicatif : {product.stockQty}</span>
                ) : null}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!canPurchase) {
                info('Les articles herboristerie sont réservés aux comptes professionnels.');
                return;
              }
              onAddToCart(product);
            }}
            className="flex h-11 w-11 shrink-0 touch-manipulation cursor-pointer items-center justify-center rounded-full bg-[#1a1a1a] transition-colors hover:bg-[#a4a374] disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
            aria-label="Add to cart"
            disabled={isOutOfStock || !canPurchase}
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
