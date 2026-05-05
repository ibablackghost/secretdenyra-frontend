import { useParams, Link } from 'react-router';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { Star, Check, Truck, ShieldCheck, ArrowLeft, Plus, Minus, Heart } from 'lucide-react';
import { useState } from 'react';
import { useCatalog } from '../lib/useCatalog';
import { formatPrice } from '../lib/price';

export const Product = () => {
  const { slug } = useParams();
  const { products, loading, error } = useCatalog();
  const product = products.find((p) => p.slug === slug);
  const { addItem } = useCartStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inWishlist = useWishlistStore((s) => (product ? s.ids.includes(product.id) : false));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product.id);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 text-gray-500">Chargement du produit...</div>;
  }

  if (error) {
    return <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 text-red-600">{error}</div>;
  }

  if (!product) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
        <p className="text-gray-700">Produit introuvable.</p>
        <Link to="/shop" className="mt-4 inline-flex text-[#a4a374] hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour a la boutique
        </Link>
      </div>
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
              onClick={() => toggleWishlist(product.id)}
              className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md transition-colors hover:bg-white"
            >
              <Heart className={`h-6 w-6 ${inWishlist ? 'fill-[#c45c5c] text-[#c45c5c]' : ''}`} />
            </button>
             <img src={product.image} alt={product.name} className="w-[85%] h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="grid grid-cols-4 gap-4">
             {[1,2,3,4].map(i => (
               <div key={i} className={`aspect-square rounded-[12px] bg-gray-50 border-2 ${i === 1 ? 'border-[#a4a374]' : 'border-transparent cursor-pointer hover:border-gray-200'} p-2 flex items-center justify-center transition-colors`}>
                 <img src={product.image} alt={`Vue ${i}`} className="w-full h-full object-contain" />
               </div>
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
            {formatPrice(product.price)}
          </div>

          <p className="text-base text-gray-600 mb-8 leading-relaxed">
            {product.ingredients}. Un mélange réconfortant spécialement conçu pour votre bien-être. L'association des plantes soigneusement sélectionnées offre une tasse équilibrée, savoureuse et riche en bienfaits naturels.
          </p>

          {/* Format (Adaptation des variantes) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wider font-['Mulish',sans-serif]">Format</h3>
              <button className="text-xs text-gray-500 underline">Guide des formats</button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2.5 border-2 border-[#a4a374] rounded-[8px] text-sm font-bold text-[#1a1a1a] bg-[#a4a374]/5">Vrac 100g</button>
              <button className="px-5 py-2.5 border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all">Boîte 50g</button>
              <button className="px-5 py-2.5 border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all">20 Sachets</button>
            </div>
          </div>

          {/* Actions d'Achat */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10 pt-4">
             <div className="flex items-center justify-between border border-gray-300 rounded-[8px] h-[52px] w-full sm:w-[140px] px-2 bg-white">
               <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black rounded-md hover:bg-gray-50 transition-colors">
                 <Minus className="w-4 h-4" />
               </button>
               <span className="font-semibold text-[#1a1a1a] text-lg">{quantity}</span>
               <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black rounded-md hover:bg-gray-50 transition-colors">
                 <Plus className="w-4 h-4" />
               </button>
             </div>

             <button 
               onClick={handleAdd}
               className={`flex-1 h-[52px] rounded-[8px] font-bold text-base flex items-center justify-center gap-2 transition-all ${
                 added ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] hover:bg-[#303030] text-white shadow-lg shadow-black/10'
               }`}
             >
               {added ? (
                 <><Check className="w-5 h-5" /> Ajouté au panier</>
               ) : (
                 'Ajouter au panier'
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
    </div>
  );
};