import image_Gemini_Generated_Image_4hyvy04hyvy04hyv_1 from '@/imports/Gemini_Generated_Image_4hyvy04hyvy04hyv_1.png';
import imgLogo from 'figma:asset/04c30533fe5a9a60b6e7341851231c595d46cb74.png';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useViewedProductsStore } from '../store/viewedProductsStore';
import { UIProduct } from '../lib/catalog';
import { useCatalog } from '../lib/useCatalog';
import { ErrorState, LoadingState } from '../components/ui/AsyncState';
import { ProductCard } from '../features/catalog/components/ProductCard';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../hooks/useI18n';
import { useCartAddedBarStore } from '../store/cartAddedBarStore';
import { useSeo } from '../hooks/useSeo';
import { trackAddToCart } from '../services/analytics/tracking';
import {
  checkoutProductRef,
  checkoutVariantRef,
  getDefaultVariant,
  isBioTeaProduct,
  unitPriceForLine,
  variantLineId,
} from '../features/catalog/productUtils';
import { RetailLocationsMap } from '../features/home/components/RetailLocationsMap';

const HOME_SECTION_PRODUCT_LIMIT = 4;

const ProductGrid = ({
  title,
  products,
  viewAllHref = '/shop',
  seeAllLabel,
}: {
  title: string;
  products: UIProduct[];
  viewAllHref?: string;
  seeAllLabel: string;
}) => {
  const { addItem } = useCartStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const { info } = useToast();
  const showCartBar = useCartAddedBarStore((s) => s.show);

  const handleAddToCart = (product: UIProduct) => {
    const def = getDefaultVariant(product);
    const variantId = def ? checkoutVariantRef(product, variantLineId(def)) : undefined;
    void addItem(checkoutProductRef(product), { variantId, quantity: 1 });
    trackAddToCart({ ...product, price: unitPriceForLine(product, variantId) }, 1);
    showCartBar(product.name);
  };

  const handleToggleWishlist = (product: UIProduct, wished: boolean) => {
    toggleWishlist(product.id);
    info(wished ? `Retiré des favoris: ${product.name}` : `Ajouté aux favoris: ${product.name}`);
  };

  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
      <div className="flex justify-between items-end mb-12">
        <h2 className="font-['Mulish',sans-serif] text-2xl md:text-3xl font-semibold text-[#303030]">{title}</h2>
        <Link
          to={viewAllHref}
          className="text-[#313131] font-medium flex items-center gap-2 hover:text-[#a4a374] transition-colors text-sm"
        >
          {seeAllLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            wished={isWishlisted({ id: product.id, slug: product.slug })}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </section>
  );
};

export const Home = () => {
  const { t } = useI18n();
  const { products, tags, loading, error } = useCatalog();
  const viewedIds = useViewedProductsStore((s) => s.ids);

  const { homeFavorites, homeBestsellers, homePopular, homeViewed } = useMemo(() => {
    const lim = HOME_SECTION_PRODUCT_LIMIT;
    if (!products.length) {
      return {
        homeFavorites: [] as UIProduct[],
        homeBestsellers: [] as UIProduct[],
        homePopular: [] as UIProduct[],
        homeViewed: [] as UIProduct[],
      };
    }
    const homeFavorites = products.filter(isBioTeaProduct).slice(0, lim);
    const homeBestsellers = [...products].sort((a, b) => b.rating - a.rating).slice(0, lim);
    const homePopular = [...products].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0)).slice(0, lim);
    const homeViewed = viewedIds
      .map((id) => products.find((p) => p.id === id || p.slug === id))
      .filter((p): p is UIProduct => p != null)
      .slice(0, lim);
    return { homeFavorites, homeBestsellers, homePopular, homeViewed };
  }, [products, viewedIds]);

  useSeo({
    title: t('seo.home.title'),
    description: t('seo.home.description'),
    canonicalPath: '/',
  });

  const seeAll = t('home.seeAll');

  return (
    <div className="w-full pb-20">
      <section className="relative bg-[#edede3] w-full overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-24 lg:py-32 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 z-10 flex flex-col items-start gap-8 nyra-reveal">
            <h1 className="font-['Flamenco',sans-serif] text-5xl md:text-6xl lg:text-[61px] leading-[1.1] text-[#131313] tracking-[-0.4px]">
              {t('home.hero.title.1')} <span className="text-[#8d8c5d]">{t('home.hero.title.pure')}</span>
              {t('home.hero.title.2')} <span className="text-[#8d8c5d]">{t('home.hero.title.infused')}</span>{' '}
              {t('home.hero.title.3')}
            </h1>
            <p className="font-['Mulish',sans-serif] text-lg md:text-xl lg:text-[24px] leading-[30px] text-[#131313] max-w-lg">
              {t('home.hero.sub')}
            </p>
            <Link
              to="/shop"
              className="bg-[#a4a374] text-white px-8 py-4 rounded-full font-semibold text-lg md:text-xl flex items-center gap-3 hover:bg-[#8d8c5d] transition-colors shadow-sm"
            >
              {t('home.hero.cta')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="w-full md:w-1/2 relative mt-12 md:mt-0 nyra-reveal" style={{ animationDelay: '180ms' }}>
            <img
              src={image_Gemini_Generated_Image_4hyvy04hyvy04hyv_1}
              alt="Tea preparation"
              loading="eager"
              className="w-full h-auto object-cover max-w-[800px] ml-auto mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#edede3]/80 md:hidden" />
          </div>
        </div>
      </section>

      {loading ? (
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
          <LoadingState message={t('common.loadingProducts')} className="py-4" />
        </section>
      ) : error ? (
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-16">
          <ErrorState message={error} className="py-4" />
        </section>
      ) : (
        <ProductGrid
          title={t('home.favorites')}
          products={homeFavorites}
          viewAllHref="/shop/category/thes-bio"
          seeAllLabel={seeAll}
        />
      )}

      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 bg-[#fcfcfc]">
        <div className="flex justify-between items-end mb-12">
          <h2 className="font-['Mulish',sans-serif] text-2xl md:text-3xl font-semibold text-[#303030]">
            {t('home.families')}
          </h2>
          <Link to="/shop" className="text-[#313131] font-medium flex items-center gap-2 hover:text-[#a4a374] transition-colors">
            {seeAll} <ArrowRight className="w-4 h-4" />
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
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="font-semibold text-sm text-[#1a1a1a] group-hover:text-[#a4a374] transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {!loading && !error && (
        <ProductGrid title={t('home.bestsellers')} products={homeBestsellers} seeAllLabel={seeAll} />
      )}

      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-20">
        <div className="bg-[#FAF9F6] rounded-[24px] overflow-hidden flex flex-col md:flex-row items-center border border-gray-100">
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">
              {t('home.promo.eyebrow')}
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#303030] mb-6 uppercase">
              {t('home.promo.title')}
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed text-sm md:text-base">{t('home.promo.body')}</p>
            <ul className="flex flex-col gap-4 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#a4a374]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#a4a374]">
                  ✓
                </div>
                <span>
                  <strong>{t('home.promo.auto.title')}</strong>
                  <br />
                  <span className="text-gray-500">{t('home.promo.auto.sub')}</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#a4a374]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#a4a374]">
                  ✓
                </div>
                <span>
                  <strong>{t('home.promo.flex.title')}</strong>
                  <br />
                  <span className="text-gray-500">{t('home.promo.flex.sub')}</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#a4a374]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#a4a374]">
                  ✓
                </div>
                <span>
                  <strong>{t('home.promo.routine.title')}</strong>
                  <br />
                  <span className="text-gray-500">{t('home.promo.routine.sub')}</span>
                </span>
              </li>
            </ul>
          </div>
          <div className="w-full md:w-1/2 h-full min-h-[400px] relative">
            <img src={imgLogo} alt="" loading="lazy" className="w-full h-full object-cover mix-blend-multiply opacity-5" />
            <img
              src="https://images.unsplash.com/photo-1620402602751-84569d1f5191?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHdvbWFuJTIwZml0bmVzcyUyMGhvbGRpbmclMjB3YXRlciUyMGJvdHRsZXxlbnwxfHx8fDE3Nzc3NzgwOTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Wellness routine"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {!loading && !error && <ProductGrid title={t('home.popular')} products={homePopular} seeAllLabel={seeAll} />}

      <RetailLocationsMap />

      {!loading && !error && homeViewed.length > 0 && (
        <ProductGrid title={t('home.viewed')} products={homeViewed} seeAllLabel={seeAll} />
      )}
    </div>
  );
};
