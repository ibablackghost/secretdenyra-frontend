import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link, useParams } from 'react-router';
import { SlidersHorizontal, Search, RotateCcw, X } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { productMatchesQuery } from '../lib/search';
import { useCatalog } from '../lib/useCatalog';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { ProductCard } from '../features/catalog/components/ProductCard';
import { useToast } from '../hooks/useToast';
import type { UIProduct } from '../features/catalog/types';
import { useSeo } from '../hooks/useSeo';
import { trackAddToCart } from '../services/analytics/tracking';

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug } = useParams();
  const categoryFilter = categorySlug ?? searchParams.get('category') ?? '';
  const teaFamilyTagFilter = searchParams.get('teaTag') ?? '';
  const urlQ = searchParams.get('q') ?? '';
  const sortBy = searchParams.get('sort') ?? 'popular';
  const priceMax = Number(searchParams.get('priceMax') ?? '50000');
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSize = Math.max(1, Number(searchParams.get('pageSize') ?? '12'));

  const [inputValue, setInputValue] = useState(urlQ);

  const { addItem } = useCartStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishIds = useWishlistStore((s) => s.ids);
  const { products, categories, tags, loading, error } = useCatalog();
  const { success, info } = useToast();

  const selectedCategoryName = categoryFilter ? categories.find((c) => c.slug === categoryFilter)?.name : '';
  useSeo({
    title: selectedCategoryName ? `${selectedCategoryName} - Boutique` : 'Boutique',
    description: selectedCategoryName
      ? `Découvrez notre sélection ${selectedCategoryName} avec filtres et tri.`
      : 'Catalogue Secret de Nyra: thés, infusions et accessoires.',
    canonicalPath: categoryFilter ? `/shop/category/${categoryFilter}` : '/shop',
  });

  useEffect(() => {
    setInputValue(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = inputValue.trim();
          const n = new URLSearchParams(prev);
          if (next) n.set('q', next);
          else n.delete('q');
          n.set('page', '1');
          return n;
        },
        { replace: true }
      );
    }, 320);
    return () => window.clearTimeout(t);
  }, [inputValue, setSearchParams]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categoryFilter) {
      result = result.filter((p) => p.category.slug === categoryFilter);
    }

    if (teaFamilyTagFilter) {
      result = result.filter((p) =>
        p.tags.some((tag) => tag.slug === teaFamilyTagFilter)
      );
    }

    if (inputValue.trim()) {
      result = result.filter((p) => productMatchesQuery(p, inputValue));
    }
    
    result = result.filter((p) => p.price >= 0 && p.price <= priceMax);
    
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }
    
    return result;
  }, [categoryFilter, teaFamilyTagFilter, inputValue, priceMax, sortBy, products]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const updateQuery = (entries: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(entries).forEach(([key, value]) => {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      });
      return next;
    });
  };

  const handleAddToCart = (product: UIProduct) => {
    addItem(product.id);
    trackAddToCart(product, 1);
    success(`Ajouté au panier: ${product.name}`);
  };

  const handleToggleWishlist = (product: UIProduct, wished: boolean) => {
    toggleWishlist(product.id);
    info(wished ? `Retiré des favoris: ${product.name}` : `Ajouté aux favoris: ${product.name}`);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row gap-12">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-[280px] shrink-0 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-[#1a1a1a] font-bold text-xl font-['Mulish',sans-serif]">
            <SlidersHorizontal className="w-5 h-5" />
            Filtres
          </div>
          <button 
            onClick={() => {
              setInputValue('');
              updateQuery({
                category: null,
                teaTag: null,
                q: null,
                sort: 'popular',
                page: '1',
                pageSize: String(pageSize),
                priceMax: '50000',
              });
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        
        {/* Prix */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">Prix (XOF)</h3>
          <div className="pt-2">
            <input 
              type="range" 
              min="0" 
              max="50000" 
              step="1000"
              value={priceMax}
              onChange={(e) => updateQuery({ priceMax: String(Number(e.target.value)), page: '1' })}
              className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <span>0</span>
              <span className="font-bold text-black">{priceMax}</span>
            </div>
          </div>
        </div>

        {/* Effets (Adaptation des couleurs) */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">Effets recherchés</h3>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-[#f4e79b] border-2 border-transparent focus:border-black hover:scale-110 transition-transform shadow-sm flex items-center justify-center group relative">
              <span className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Énergie</span>
            </button>
            <button className="w-10 h-10 rounded-full bg-[#8bb587] border-2 border-transparent focus:border-black hover:scale-110 transition-transform shadow-sm flex items-center justify-center group relative">
              <span className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Sommeil</span>
            </button>
            <button className="w-10 h-10 rounded-full bg-[#527d5e] border-2 border-transparent focus:border-black hover:scale-110 transition-transform shadow-sm flex items-center justify-center group relative">
              <span className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Digestion</span>
            </button>
            <button className="w-10 h-10 rounded-full bg-[#272824] border-2 border-transparent focus:border-black hover:scale-110 transition-transform shadow-sm flex items-center justify-center group relative">
              <span className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Détox</span>
            </button>
          </div>
        </div>

        {/* Formats (Adaptation de Size) */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">Format</h3>
          <div className="flex flex-wrap gap-2">
            <button className="h-10 px-4 flex items-center justify-center border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:border-black focus:border-black focus:text-black transition-colors">Vrac 50g</button>
            <button className="h-10 px-4 flex items-center justify-center border-2 border-black rounded-[8px] text-sm font-bold text-black transition-colors">Vrac 100g</button>
            <button className="h-10 px-4 flex items-center justify-center border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:border-black focus:border-black focus:text-black transition-colors">Boîte 20s</button>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">Catégories</h3>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="category"
                checked={!categoryFilter}
                onChange={() => {
                  updateQuery({ category: null, page: '1' });
                }}
                className="w-4 h-4 text-black border-gray-300 focus:ring-black cursor-pointer accent-black"
              />
              <span className={`text-sm ${!categoryFilter ? 'font-bold text-black' : 'text-gray-600 group-hover:text-black'}`}>
                Tous nos thés
              </span>
            </label>
            {categories.map(cat => (
              <label key={cat.slug} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="category"
                  checked={categoryFilter === cat.slug}
                  onChange={() => {
                    updateQuery({ category: cat.slug, page: '1' });
                  }}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black cursor-pointer accent-black"
                />
                <span className={`text-sm ${categoryFilter === cat.slug ? 'font-bold text-black' : 'text-gray-600 group-hover:text-black'}`}>
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags (Famille de thé) */}
        {tags.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">Famille de thé (tags)</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="teaTag"
                  checked={!teaFamilyTagFilter}
                  onChange={() => {
                    updateQuery({ teaTag: null, page: '1' });
                  }}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black cursor-pointer accent-black"
                />
                <span className={`text-sm ${!teaFamilyTagFilter ? 'font-bold text-black' : 'text-gray-600 group-hover:text-black'}`}>
                  Tous les tags
                </span>
              </label>
              {tags.map((tag) => (
                <label key={tag.slug} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="teaTag"
                    checked={teaFamilyTagFilter === tag.slug}
                    onChange={() => {
                      updateQuery({ teaTag: tag.slug, page: '1' });
                    }}
                    className="w-4 h-4 text-black border-gray-300 focus:ring-black cursor-pointer accent-black"
                  />
                  <span className={`text-sm ${teaFamilyTagFilter === tag.slug ? 'font-bold text-black' : 'text-gray-600 group-hover:text-black'}`}>
                    {tag.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-8">
          <div className="mb-6 rounded-[12px] border border-gray-100 bg-white p-4 shadow-sm">
            <label htmlFor="shop-search" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 font-['Mulish',sans-serif]">
              Recherche dans cette page
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="shop-search"
                  type="search"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Nom, ingrédient, catégorie, tag…"
                  className="w-full rounded-[10px] border border-gray-200 py-3 pl-10 pr-10 font-['Mulish',sans-serif] text-sm outline-none focus:border-[#a4a374] focus:ring-2 focus:ring-[#a4a374]/20"
                />
                {inputValue && (
                  <button
                    type="button"
                    aria-label="Effacer la recherche"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    onClick={() => setInputValue('')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {inputValue.trim() ? (
              <p className="mt-2 text-sm text-gray-600 font-['Mulish',sans-serif]">
                {totalItems} résultat{totalItems !== 1 ? 's' : ''} pour «{' '}
                <span className="font-semibold text-[#1a1a1a]">{inputValue.trim()}</span> » (accents ignorés)
              </p>
            ) : (
              <p className="mt-2 text-xs text-gray-400 font-['Mulish',sans-serif]">
                La recherche du bandeau du haut ouvre aussi cette page avec le même filtre (<code className="rounded bg-gray-100 px-1">?q=</code>
                ).
              </p>
            )}
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <span className="text-gray-300">&gt;</span>
            <span className="text-black font-medium">{categoryFilter ? categories.find(c => c.slug === categoryFilter)?.name : 'Nos thés bio'}</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="font-['Mulish',sans-serif] text-3xl md:text-4xl font-bold text-[#1a1a1a]">
              {categoryFilter ? categories.find(c => c.slug === categoryFilter)?.name : 'Nos thés bio'}
            </h1>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => updateQuery({ sort: e.target.value, page: '1' })}
                className="bg-transparent border-none text-sm font-bold text-[#1a1a1a] focus:outline-none cursor-pointer"
              >
                <option value="popular">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Chargement des produits..." className="py-20" />
        ) : error ? (
          <ErrorState message={error} className="py-20" />
        ) : paginatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wished={wishIds.includes(product.id)}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun produit trouvé"
            description="Essayez d'ajuster vos filtres ou votre recherche."
            className="py-20"
            action={
              <button
                onClick={() => {
                  setInputValue('');
                  updateQuery({
                    category: null,
                    teaTag: null,
                    q: null,
                    sort: 'popular',
                    page: '1',
                    pageSize: String(pageSize),
                    priceMax: '50000',
                  });
                }}
                className="text-[#a4a374] font-medium hover:underline"
              >
                Réinitialiser les filtres
              </button>
            }
          />
        )}

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              className="px-4 h-10 flex items-center justify-center rounded-[8px] hover:bg-gray-50 text-gray-600 font-medium transition-colors disabled:opacity-40"
              onClick={() => updateQuery({ page: String(safePage - 1) })}
              disabled={safePage <= 1}
            >
              &lt; Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {safePage} / {totalPages}
            </span>
            <button
              className="px-4 h-10 flex items-center justify-center rounded-[8px] hover:bg-gray-50 text-gray-600 font-medium transition-colors disabled:opacity-40"
              onClick={() => updateQuery({ page: String(safePage + 1) })}
              disabled={safePage >= totalPages}
            >
              Next &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};