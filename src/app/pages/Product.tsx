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
import type { UIProduct } from '../features/catalog/types';
import { useViewedProductsStore } from '../store/viewedProductsStore';
import { useSeo } from '../hooks/useSeo';
import { trackAddToCart, trackViewProduct } from '../services/analytics/tracking';

export const Product = () => {
  const { slug } = useParams();
  const { products, loading, error } = useCatalog();
  const product = products.find((p) => p.slug === slug);
  const { addItem } = useCartStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishIds = useWishlistStore((s) => s.ids);
  const inWishlist = useWishlistStore((s) => (product ? s.ids.includes(product.id) : false));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const { success, info } = useToast();
  const pushViewed = useViewedProductsStore((s) => s.push);

  useSeo({
    title: product ? product.name : 'Produit',
    description: product
      ? `${product.name} - ${product.ingredients}. Achetez en ligne sur Secret de Nyra.`
      : 'Produit Secret de Nyra.',
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
    const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[];
    const colors = Array.from(new Set(product.variants.map((v) => v.colorName).filter(Boolean))) as string[];
    setSelectedSize(sizes[0] ?? '');
    setSelectedColor(colors[0] ?? '');
    setQuantity(1);
  }, [product?.id]);

  useEffect(() => {
    if (product?.id) pushViewed(product.id);
  }, [product?.id, pushViewed]);

  useEffect(() => {
    if (!product) return;
    trackViewProduct(product);
  }, [product]);

  const filteredVariants = useMemo(() => {
    if (!product?.variants?.length) return [];
    return product.variants.filter((variant) => {
      const sizeOk = selectedSize ? variant.size === selectedSize : true;
      const colorOk = selectedColor ? variant.colorName === selectedColor : true;
      return sizeOk && colorOk;
    });
  }, [product?.variants, selectedSize, selectedColor]);

  const activeVariant = filteredVariants[0];
  const effectivePrice = activeVariant?.price ?? product?.price ?? 0;
  const effectiveCompareAt = activeVariant?.compareAtPrice ?? product?.compareAtPrice;
  const effectiveStockQty = activeVariant?.stockQty ?? product?.stockQty;
  const isInStock = (activeVariant?.inStock ?? product?.inStock ?? true) && (effectiveStockQty === undefined || effectiveStockQty > 0);
  const maxQty = Math.max(1, Math.min(effectiveStockQty ?? 20, 20));

  const similarProducts = useMemo(() => {
    if (!product) return [];
    const productTagSlugs = new Set(product.tags.map((tag) => tag.slug));
    return products
      .filter((item) => item.id !== product.id)
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

  const handleAdd = () => {
    if (!product || !isInStock) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product.id);
    }
    trackAddToCart(product, quantity);
    success(`Ajouté au panier: ${product.name} x${quantity}`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddToCart = (item: UIProduct) => {
    addItem(item.id);
    trackAddToCart(item, 1);
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
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 font-['Mulish',sans-serif]">
        <Link to="/" className="hover:text-[#1a1a1a] transition-colors">Accueil</Link>
        <span className="text-gray-300">/</span>
        <Link to="/shop" className="hover:text-[#1a1a1a] transition-colors">Boutique</Link>
        <span className="text-gray-300">/</span>
        <span className="text-[#1a1a1a] font-medium truncate">{product.name}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        {/* Images Produit */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className={`${product.bgClass} w-full aspect-[4/5] sm:aspect-square rounded-[16px] flex items-center justify-center p-8 relative overflow-hidden bg-gray-50`}>
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
                className={`aspect-square rounded-[12px] bg-gray-50 border-2 ${
                  selectedImageIndex === index ? 'border-[#a4a374]' : 'border-transparent hover:border-gray-200'
                } p-2 flex items-center justify-center transition-colors`}
              >
                <MediaImage src={image} alt={`Vue ${index + 1}`} className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
              </button>
            ))}
          </div>
        </div>

        {/* Détails Produit */}
        <div className="w-full md:w-1/2 flex flex-col pt-2 md:pt-6">
          <div className="flex flex-col gap-3 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#a4a374] uppercase font-['Mulish',sans-serif]">{product.category.name}</span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a1a] font-['Mulish',sans-serif] leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className={`w-4 h-4 ${star <= Math.floor(product.rating) ? 'fill-[#a4a374] text-[#a4a374]' : 'fill-gray-200 text-gray-200'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500 underline decoration-gray-300 underline-offset-4 cursor-pointer hover:text-black">Voir les {product.reviews} avis</span>
            </div>
          </div>
          
          <div className="text-3xl font-bold text-[#1a1a1a] mb-6">
            {formatPrice(effectivePrice)}
            {effectiveCompareAt && effectiveCompareAt > effectivePrice ? (
              <span className="ml-3 text-lg font-medium text-gray-400 line-through">{formatPrice(effectiveCompareAt)}</span>
            ) : null}
          </div>

          <p className="text-base text-gray-600 mb-8 leading-relaxed">
            {product.ingredients}. Un mélange réconfortant spécialement conçu pour votre bien-être. L'association des plantes soigneusement sélectionnées offre une tasse équilibrée, savoureuse et riche en bienfaits naturels.
          </p>

          {/* Variantes (taille/couleur) */}
          {product.variants.length > 0 ? (
            <div className="mb-8 space-y-5">
              {Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))).length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#1a1a1a]">Taille</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size!)}
                        className={`rounded-[8px] px-4 py-2 text-sm ${selectedSize === size ? 'border-2 border-[#a4a374] bg-[#a4a374]/5 font-semibold' : 'border border-gray-200 text-gray-700'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {Array.from(new Set(product.variants.map((v) => v.colorName).filter(Boolean))).length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#1a1a1a]">Couleur</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(product.variants.map((v) => v.colorName).filter(Boolean))).map((color) => {
                      const colorHex = product.variants.find((v) => v.colorName === color)?.colorHex;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color!)}
                          className={`inline-flex items-center gap-2 rounded-[8px] px-3 py-2 text-sm ${
                            selectedColor === color ? 'border-2 border-[#a4a374] bg-[#a4a374]/5 font-semibold' : 'border border-gray-200 text-gray-700'
                          }`}
                        >
                          {colorHex ? <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: colorHex }} /> : null}
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mb-8">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                isInStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {isInStock ? `En stock${effectiveStockQty ? ` (${effectiveStockQty})` : ''}` : 'Rupture de stock'}
            </span>
          </div>

          {/* Actions d'Achat */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10 pt-4">
             <div className="flex items-center justify-between border border-gray-300 rounded-[8px] h-[52px] w-full sm:w-[140px] px-2 bg-white">
               <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black rounded-md hover:bg-gray-50 transition-colors" disabled={!isInStock}>
                 <Minus className="w-4 h-4" />
               </button>
               <span className="font-semibold text-[#1a1a1a] text-lg">{quantity}</span>
               <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black rounded-md hover:bg-gray-50 transition-colors" disabled={!isInStock}>
                 <Plus className="w-4 h-4" />
               </button>
             </div>

             <button 
               onClick={handleAdd}
               disabled={!isInStock}
               className={`flex-1 h-[52px] rounded-[8px] font-bold text-base flex items-center justify-center gap-2 transition-all ${
                 added ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] hover:bg-[#303030] text-white shadow-lg shadow-black/10 disabled:opacity-60 disabled:cursor-not-allowed'
               }`}
             >
               {added ? (
                 <><Check className="w-5 h-5" /> Ajouté au panier</>
               ) : (
                 isInStock ? 'Ajouter au panier' : 'Indisponible'
               )}
             </button>
          </div>

          {/* Réassurance */}
          <div className="grid grid-cols-1 gap-4 text-sm text-[#1a1a1a] py-6 border-y border-gray-100">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-[#a4a374]/10 flex items-center justify-center shrink-0">
                 <Truck className="w-4 h-4 text-[#a4a374]" />
               </div>
               <span className="font-medium">Livraison offerte dès 45 000 XOF d'achat</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-[#a4a374]/10 flex items-center justify-center shrink-0">
                 <ShieldCheck className="w-4 h-4 text-[#a4a374]" />
               </div>
               <span className="font-medium">Thé certifié 100% agriculture biologique</span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Onglets de Description */}
      <div className="mt-16 md:mt-24">
         <div className="flex gap-8 border-b border-gray-200 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
           <button className="pb-4 font-bold text-[#1a1a1a] border-b-2 border-[#a4a374] text-lg font-['Mulish',sans-serif]">Description</button>
           <button className="pb-4 font-medium text-gray-400 hover:text-[#1a1a1a] text-lg font-['Mulish',sans-serif] transition-colors">Conseils de préparation</button>
           <button className="pb-4 font-medium text-gray-400 hover:text-[#1a1a1a] text-lg font-['Mulish',sans-serif] transition-colors">Avis ({product.reviews})</button>
         </div>
         <div className="max-w-3xl text-gray-600 leading-relaxed space-y-6 text-base">
           <p>Un mélange réconfortant spécialement conçu pour faciliter la digestion après les repas. L'association de la menthe poivrée, rafraîchissante, de l'anis et du fenouil, connus pour leurs propriétés digestives, offre une tasse équilibrée et savoureuse.</p>
           <p>Cultivé dans le respect de la nature, sans pesticides, pour préserver toutes les qualités gustatives et les bienfaits des plantes. À conserver dans un endroit frais et sec, à l'abri de la lumière pour préserver tous ses arômes.</p>
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
                wished={wishIds.includes(item.id)}
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