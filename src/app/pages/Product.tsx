import { useParams, Link } from 'react-router';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { Star, Check, Truck, ShieldCheck, ArrowLeft, Plus, Minus, Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../lib/useCatalog';
import { formatPrice } from '../lib/price';
import { EmptyState, ErrorState } from '../components/ui/AsyncState';
import { ProductPageSkeleton } from '../features/catalog/components/ProductPageSkeleton';
import { MediaImage } from '../components/ui/MediaImage';
import { ProductCard } from '../features/catalog/components/ProductCard';
import { useToast } from '../hooks/useToast';
import type { UIProduct, UIProductVariant } from '../features/catalog/types';
import { getDefaultVariant, stockForLine } from '../features/catalog/productUtils';
import { useViewedProductsStore } from '../store/viewedProductsStore';
import { useSeo } from '../hooks/useSeo';
import { trackAddToCart, trackViewProduct } from '../services/analytics/tracking';
import { useHerboristeriePriceAccess } from '../hooks/useHerboristeriePriceAccess';
import { ProfessionalPriceHint } from '../components/catalog/ProfessionalPriceHint';

export const Product = () => {
  const { slug } = useParams();
  const { products, loading, error } = useCatalog();
  const product = products.find((p) => p.slug === slug);
  const { addItem } = useCartStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const inWishlist = useWishlistStore((s) =>
    product ? s.isWishlisted({ id: product.id, slug: product.slug }) : false
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<UIProductVariant | null>(null);
  const { success, info } = useToast();
  const { shouldHidePrice, canPurchaseProduct } = useHerboristeriePriceAccess();
  const pushViewed = useViewedProductsStore((s) => s.push);

  const seoTitle = product?.metaTitle?.trim() || product?.name || 'Produit';
  const seoDescription =
    product?.metaDescription?.trim() ||
    product?.shortDescription?.trim() ||
    product?.ingredients ||
    'Produit Secret de Nyra.';

  useSeo({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: product ? `/product/${product.slug}` : '/shop',
    ogImage: product?.image,
  });

  const gallery = useMemo(() => {
    if (!product) return [];
    return (product.gallery?.length ? product.gallery : [product.image]).filter(Boolean);
  }, [product]);

  useEffect(() => {
    setSelectedImageIndex(0);
    if (!product) return;
    setSelectedVariant(getDefaultVariant(product));
    setQuantity(1);
  }, [product?.slug]);

  useEffect(() => {
    if (product?.id) void pushViewed(product.id);
  }, [product?.id, pushViewed]);

  const resolvedVariant = useMemo(
    () => (product ? selectedVariant ?? getDefaultVariant(product) : null),
    [product, selectedVariant]
  );

  const effectivePrice = resolvedVariant?.price ?? product?.price ?? 0;
  const effectiveCompareAt = resolvedVariant?.compareAtPrice ?? product?.compareAtPrice;
  const { qty: effectiveStockQty, inStock: variantStockOk } = product
    ? stockForLine(product, resolvedVariant?.id)
    : { qty: undefined, inStock: true };
  const isInStock = variantStockOk;
  const maxQty = Math.max(1, Math.min(effectiveStockQty ?? 20, 20));

  useEffect(() => {
    if (!product) return;
    trackViewProduct({ ...product, price: resolvedVariant?.price ?? product.price });
  }, [product, resolvedVariant?.id]);

  const similarProducts = useMemo(() => {
    if (!product) return [];
    const productTagSlugs = new Set(product.tags.map((tag) => tag.slug));
    return products
      .filter((item) => item.id !== product.id && item.slug !== product.slug)
      .map((item) => {
        let score = 0;
        if (item.category.slug === product.category.slug) score += 2;
        if (item.tags.some((tag) => productTagSlugs.has(tag.slug))) score += 1;
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ item }) => item);
  }, [product, products]);

  const descriptionBlocks = useMemo(() => {
    if (!product) return [];
    const parts: string[] = [];
    if (product.shortDescription?.trim()) parts.push(product.shortDescription.trim());
    if (product.description?.trim() && product.description.trim() !== product.shortDescription?.trim()) {
      parts.push(product.description.trim());
    }
    if (parts.length === 0 && product.ingredients?.trim()) parts.push(product.ingredients.trim());
    return parts;
  }, [product]);

  const hasInfusionExtras = Boolean(
    product &&
      (product.dosage ||
        product.infusionTime ||
        product.temperature ||
        product.botanicalName ||
        product.origin)
  );

  const hidePrice = product ? shouldHidePrice(product) : false;
  const canPurchase = product ? canPurchaseProduct(product) : false;

  const handleAdd = () => {
    if (!product || !isInStock) return;
    if (!canPurchase) {
      info('Les articles herboristerie sont réservés aux comptes professionnels.');
      return;
    }
    const variantId = product.variants.length > 0 ? resolvedVariant?.id : undefined;
    if (product.variants.length > 0 && !variantId) return;
    void addItem(product.id, { variantId, quantity });
    trackAddToCart({ ...product, price: effectivePrice }, quantity);
    success(`Ajouté au panier: ${product.name} x${quantity}`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddToCart = (item: UIProduct) => {
    if (!canPurchaseProduct(item)) {
      info('Les articles herboristerie sont réservés aux comptes professionnels.');
      return;
    }
    const def = getDefaultVariant(item);
    void addItem(item.id, { variantId: def?.id, quantity: 1 });
    trackAddToCart({ ...item, price: def?.price ?? item.price }, 1);
    success(`Ajouté au panier: ${item.name}`);
  };

  const handleToggleWishlist = (item: UIProduct, wished: boolean) => {
    toggleWishlist(item.id);
    info(wished ? `Retiré des favoris: ${item.name}` : `Ajouté aux favoris: ${item.name}`);
  };

  if (loading) {
    return <ProductPageSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} className="max-w-[1400px] mx-auto px-4 md:px-8" />;
  }

  if (!product) {
    return (
      <EmptyState
        className="max-w-[1400px] mx-auto px-4 md:px-8"
        title="Produit introuvable"
        action={
          <Link to="/shop" className="inline-flex text-[#a4a374] hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour a la boutique
          </Link>
        }
      />
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-16">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 font-['Mulish',sans-serif]">
        <Link to="/" className="hover:text-[#1a1a1a] transition-colors">
          Accueil
        </Link>
        <span className="text-gray-300">/</span>
        <Link to="/shop" className="hover:text-[#1a1a1a] transition-colors">
          Boutique
        </Link>
        <span className="text-gray-300">/</span>
        <Link to={`/shop/category/${product.category.slug}`} className="hover:text-[#1a1a1a] transition-colors truncate">
          {product.category.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-[#1a1a1a] font-medium truncate">{product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="w-full aspect-[4/5] sm:aspect-square rounded-[16px] flex items-center justify-center p-8 relative overflow-hidden bg-white">
            <button
              type="button"
              aria-label={inWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              onClick={() => handleToggleWishlist(product, inWishlist)}
              className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md transition-colors hover:bg-white"
            >
              <Heart className={`h-6 w-6 ${inWishlist ? 'fill-[#c45c5c] text-[#c45c5c]' : ''}`} />
            </button>
            <MediaImage
              src={gallery[selectedImageIndex] ?? product.image}
              alt={product.name}
              className="w-[85%] h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
              fallbackClassName="w-[85%] h-[70%]"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {(gallery.length ? gallery : [product.image]).slice(0, 4).map((image, index) => (
              <button
                type="button"
                key={`${product.id}-gallery-${index}`}
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-square rounded-[12px] bg-white border-2 ${
                  selectedImageIndex === index ? 'border-[#a4a374]' : 'border-transparent hover:border-gray-200'
                } p-2 flex items-center justify-center transition-colors`}
              >
                <MediaImage src={image} alt={`Vue ${index + 1}`} className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
              </button>
            ))}
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col pt-2 md:pt-6">
          <div className="flex flex-col gap-3 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#a4a374] uppercase font-['Mulish',sans-serif]">{product.category.name}</span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a1a] font-['Mulish',sans-serif] leading-tight">{product.name}</h1>

            <div className="flex flex-wrap gap-2">
              {product.tags.slice(0, 6).map((tag) => (
                <span key={tag.slug} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {tag.name}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.floor(product.rating) ? 'fill-[#a4a374] text-[#a4a374]' : 'fill-gray-200 text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 underline decoration-gray-300 underline-offset-4 cursor-pointer hover:text-black">
                Voir les {product.reviews} avis
              </span>
            </div>
          </div>

          {hidePrice ? (
            <ProfessionalPriceHint className="mb-6" />
          ) : (
            <>
              <div className="text-3xl font-bold text-[#1a1a1a] mb-2">
                {formatPrice(effectivePrice)}
                {effectiveCompareAt && effectiveCompareAt > effectivePrice ? (
                  <span className="ml-3 text-lg font-medium text-gray-400 line-through">{formatPrice(effectiveCompareAt)}</span>
                ) : null}
              </div>
              {product.variants.length > 1 ? (
                <p className="mb-6 text-sm text-gray-500">Prix selon le format sélectionné.</p>
              ) : (
                <div className="mb-6" />
              )}
            </>
          )}

          {descriptionBlocks[0] ? (
            <p className="text-base text-gray-600 mb-6 leading-relaxed">{descriptionBlocks[0]}</p>
          ) : null}

          {product.variants.length > 0 ? (
            <div className="mb-8 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a1a1a]">Format</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const active = resolvedVariant?.id === variant.id;
                  const disabled = variant.inStock === false || (typeof variant.stockQty === 'number' && variant.stockQty <= 0);
                  const label = variant.label ?? variant.format ?? variant.name ?? variant.size ?? 'Option';
                  const vPrice = variant.price ?? product.price;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedVariant(variant)}
                      className={`rounded-[10px] border px-4 py-2 text-left text-sm transition-colors ${
                        disabled
                          ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                          : active
                            ? 'border-2 border-[#a4a374] bg-[#a4a374]/5 font-semibold'
                            : 'border border-gray-200 text-gray-800 hover:border-[#a4a374]/40'
                      }`}
                    >
                      <div className="font-medium">{label}</div>
                      {!hidePrice ? <div className="text-xs text-gray-600">{formatPrice(vPrice)}</div> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {hasInfusionExtras ? (
            <div className="mb-8 rounded-[12px] border border-gray-100 bg-[#fafafa] p-4 text-sm text-gray-700">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Préparation &amp; origine</h3>
              <ul className="space-y-1">
                {product.dosage ? <li>Dosage : {product.dosage}</li> : null}
                {product.infusionTime ? <li>Temps d&apos;infusion : {product.infusionTime}</li> : null}
                {product.temperature ? <li>Température : {product.temperature}</li> : null}
                {product.botanicalName ? <li>Nom botanique : {product.botanicalName}</li> : null}
                {product.origin ? <li>Origine : {product.origin}</li> : null}
              </ul>
            </div>
          ) : null}

          <div className="mb-8">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                isInStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {isInStock ? `En stock${effectiveStockQty !== undefined ? ` (${effectiveStockQty})` : ''}` : 'Rupture de stock'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-10 pt-4">
            <div className="flex items-center justify-between border border-gray-300 rounded-[8px] h-[52px] w-full sm:w-[140px] px-2 bg-white">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black rounded-md hover:bg-gray-50 transition-colors"
                disabled={!isInStock}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-semibold text-[#1a1a1a] text-lg">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black rounded-md hover:bg-gray-50 transition-colors"
                disabled={!isInStock}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!isInStock || !canPurchase || (product.variants.length > 0 && !resolvedVariant)}
              className={`flex-1 h-[52px] rounded-[8px] font-bold text-base flex items-center justify-center gap-2 transition-all ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-[#1a1a1a] hover:bg-[#303030] text-white shadow-lg shadow-black/10 disabled:opacity-60 disabled:cursor-not-allowed'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" /> Ajouté au panier
                </>
              ) : isInStock ? (
                'Ajouter au panier'
              ) : (
                'Indisponible'
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm text-[#1a1a1a] py-6 border-y border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#a4a374]/10 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-[#a4a374]" />
              </div>
              <span className="font-medium">Livraison offerte dès 45 000 XOF d&apos;achat</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#a4a374]/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#a4a374]" />
              </div>
              <span className="font-medium">Produits sélectionnés avec exigence qualité</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 md:mt-24">
        <div className="flex gap-8 border-b border-gray-200 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <span className="pb-4 font-bold text-[#1a1a1a] border-b-2 border-[#a4a374] text-lg font-['Mulish',sans-serif]">Description</span>
        </div>
        <div className="max-w-3xl text-gray-600 leading-relaxed space-y-6 text-base">
          {descriptionBlocks.length > 0 ? (
            descriptionBlocks.map((block, i) => <p key={i}>{block}</p>)
          ) : (
            <p>Description à venir.</p>
          )}
        </div>
      </div>

      {similarProducts.length > 0 ? (
        <section className="mt-16 md:mt-24">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#1a1a1a]">Produits similaires</h2>
            <Link to="/shop" className="text-sm font-medium text-[#a4a374] hover:underline">
              Voir toute la boutique
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                wished={isWishlisted({ id: item.id, slug: item.slug })}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
