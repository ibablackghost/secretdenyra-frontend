import image_Gemini_Generated_Image_4hyvy04hyvy04hyv_1 from '@/imports/Gemini_Generated_Image_4hyvy04hyvy04hyv_1.png';
import imgLogo from 'figma:asset/04c30533fe5a9a60b6e7341851231c595d46cb74.png';
import { Link } from 'react-router';
import { ArrowRight, Star, Heart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { UIProduct } from '../lib/catalog';
import { useCatalog } from '../lib/useCatalog';
import { formatPrice } from '../lib/price';

const ProductGrid = ({ title, products }: { title: string; products: UIProduct[] }) => {
  const { addItem } = useCartStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishIds = useWishlistStore((s) => s.ids);
  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
      <div className="flex justify-between items-end mb-12">
        <h2 className="font-['Mulish',sans-serif] text-2xl md:text-3xl font-semibold text-[#303030]">{title}</h2>
        <Link to="/shop" className="text-[#313131] font-medium flex items-center gap-2 hover:text-[#a4a374] transition-colors text-sm">
          Voir tous les produits <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="group flex flex-col gap-4"
          >
            <div className={`relative ${product.bgClass} aspect-[4/5] overflow-hidden rounded-[10px] transition-transform group-hover:scale-[1.02]`}>
              <Link to={`/product/${product.slug}`} className="absolute inset-0 flex items-center justify-center p-4">
                <div className="absolute left-4 top-4 z-[1] flex items-center gap-1 rounded-[4px] bg-white/80 px-2 py-1 backdrop-blur-sm">
                  <Star className="h-3 w-3 fill-current text-black" />
                  <span className="text-xs font-bold">{product.rating}</span>
                  <span className="text-xs text-gray-500">({product.reviews})</span>
                </div>
                <img src={product.image} alt={product.name} className="relative z-0 h-auto w-[80%] object-contain drop-shadow-md" />
              </Link>
              <button
                type="button"
                aria-label={wishIds.includes(product.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className="absolute right-4 top-4 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition-colors hover:bg-white"
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist(product.id);
                }}
              >
                <Heart className={`h-5 w-5 ${wishIds.includes(product.id) ? 'fill-[#c45c5c] text-[#c45c5c]' : ''}`} />
              </button>
            </div>
            
            <div className="flex flex-col gap-1">
              <Link to={`/product/${product.slug}`}>
                <h3 className="font-medium text-[#1a1a1a] group-hover:text-[#a4a374] transition-colors">{product.name}</h3>
                <p className="text-xs text-gray-500 truncate">{product.ingredients}</p>
              </Link>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-[#303030]">{formatPrice(product.price)}</span>
                <button 
                  onClick={() => addItem(product.id)}
                  className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#a4a374] transition-colors cursor-pointer"
                  aria-label="Add to cart"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1V15M1 8H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const Home = () => {
  const { products, tags, loading, error } = useCatalog();

  return (
    <div className="w-full pb-20">
      {/* Hero Section */}
      <section className="relative bg-[#edede3] w-full overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-24 lg:py-32 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 z-10 flex flex-col items-start gap-8 nyra-reveal">
            <h1 className="font-['Flamenco',sans-serif] text-5xl md:text-6xl lg:text-[61px] leading-[1.1] text-[#131313] tracking-[-0.4px]">
              La nature dans sa <span className="text-[#8d8c5d]">forme la plus pure</span>, <span className="text-[#8d8c5d]">infusée</span> pour votre équilibre.
            </h1>
            <p className="font-['Mulish',sans-serif] text-lg md:text-xl lg:text-[24px] leading-[30px] text-[#131313] max-w-lg">
              Découvrez une sélection exigeante de plantes certifiées bio, cultivées sans pesticides et récoltées à maturité.
            </p>
            <Link to="/shop" className="bg-[#a4a374] text-white px-8 py-4 rounded-full font-semibold text-lg md:text-xl flex items-center gap-3 hover:bg-[#8d8c5d] transition-colors shadow-sm">
              Découvrez maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="w-full md:w-1/2 relative mt-12 md:mt-0 nyra-reveal" style={{ animationDelay: '180ms' }}>
            <img 
              src={image_Gemini_Generated_Image_4hyvy04hyvy04hyv_1} 
              alt="Tea preparation" 
              className="w-full h-auto object-cover max-w-[800px] ml-auto mix-blend-multiply"
            />
            {/* Gradient overlay from design to blend bottom edge if needed */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#edede3]/80 md:hidden" />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {loading ? (
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
          <p className="text-gray-500">Chargement des produits...</p>
        </section>
      ) : error ? (
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
          <p className="text-red-600">{error}</p>
        </section>
      ) : (
        <ProductGrid title="Les favoris de nos clients" products={products} />
      )}

      {/* Tea Family Tags */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 bg-[#fcfcfc]">
        <div className="flex justify-between items-end mb-12">
          <h2 className="font-['Mulish',sans-serif] text-2xl md:text-3xl font-semibold text-[#303030]">Nos familles de thé</h2>
          <Link to="/shop" className="text-[#313131] font-medium flex items-center gap-2 hover:text-[#a4a374] transition-colors">
            Voir tous les produits <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {tags.map((cat, index) => (
            <Link
              to={`/shop?teaTag=${cat.slug}`}
              key={cat.slug}
              className="flex flex-col items-center gap-4 group nyra-reveal"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="w-full aspect-square rounded-full bg-white shadow-sm overflow-hidden flex items-center justify-center p-4 border border-gray-100 group-hover:border-[#a4a374] transition-colors">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="font-semibold text-sm text-[#1a1a1a] group-hover:text-[#a4a374] transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      {!loading && !error && <ProductGrid title="Nos meilleures ventes" products={products} />}
      
      {/* Promo Block */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-20">
        <div className="bg-[#FAF9F6] rounded-[24px] overflow-hidden flex flex-col md:flex-row items-center border border-gray-100">
           <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
             <span className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">Rituel bien-être journalier</span>
             <h2 className="text-3xl md:text-4xl font-semibold text-[#303030] mb-6">INFUSION BIEN-ÊTRE</h2>
             <p className="text-gray-600 mb-8 leading-relaxed text-sm md:text-base">
               Recevez vos mélanges favoris de façon régulière et sans tracas. Intégrez les bienfaits des plantes naturellement dans votre quotidien : un moment de détente, sans contraintes ni risque de rupture.
             </p>
             <ul className="flex flex-col gap-4 text-sm text-gray-700">
               <li className="flex items-start gap-3">
                 <div className="w-5 h-5 rounded-full bg-[#a4a374]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#a4a374]">✓</div>
                 <span><strong>Livraison automatique de vos thés</strong><br/><span className="text-gray-500">Vos infusions préférées directement chez vous, sans avoir à y penser.</span></span>
               </li>
               <li className="flex items-start gap-3">
                 <div className="w-5 h-5 rounded-full bg-[#a4a374]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#a4a374]">✓</div>
                 <span><strong>Infusions flexibles</strong><br/><span className="text-gray-500">Adaptez votre abonnement, faites une pause ou annulez en un clic.</span></span>
               </li>
               <li className="flex items-start gap-3">
                 <div className="w-5 h-5 rounded-full bg-[#a4a374]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#a4a374]">✓</div>
                 <span><strong>Routine infusée décontractée</strong><br/><span className="text-gray-500">Pour cultiver votre bien-être et votre équilibre à long terme.</span></span>
               </li>
             </ul>
           </div>
           <div className="w-full md:w-1/2 h-full min-h-[400px] relative">
             <img src={imgLogo} alt="Bien-être" className="w-full h-full object-cover mix-blend-multiply opacity-5" />
             {/* If we had the actual image of the girl with the towel, we'd use it here. I'll use unsplash tool for a suitable image since it wasn't provided in the extracted assets */}
             <img src="https://images.unsplash.com/photo-1620402602751-84569d1f5191?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHdvbWFuJTIwZml0bmVzcyUyMGhvbGRpbmclMjB3YXRlciUyMGJvdHRsZXxlbnwxfHx8fDE3Nzc3NzgwOTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="Wellness routine" className="absolute inset-0 w-full h-full object-cover" />
           </div>
        </div>
      </section>

      {/* Popular Products */}
      {!loading && !error && <ProductGrid title="Produits populaires" products={products} />}

      {/* Recently Viewed */}
      {!loading && !error && <ProductGrid title="Produits auquel vous avez cliqué" products={products} />}
    </div>
  );
};