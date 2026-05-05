import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Star, SlidersHorizontal, Search, RotateCcw, Heart, X } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { productMatchesQuery } from '../lib/search';
import { useCatalog } from '../lib/useCatalog';
import { formatPrice } from '../lib/price';

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') ?? searchParams.get('tag');
  const teaFamilyTagFilter = searchParams.get('teaTag');
  const urlQ = searchParams.get('q') ?? '';

  const [inputValue, setInputValue] = useState(urlQ);
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState([0, 50000]);

  const { addItem } = useCartStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishIds = useWishlistStore((s) => s.ids);
  const { products, categories, tags, loading, error } = useCatalog();

  useEffect(() => {
    setInputValue(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const cur = (prev.get('q') ?? '').trim();
          const next = inputValue.trim();
          if (cur === next) return prev;
          const n = new URLSearchParams(prev);
          if (next) n.set('q', next);
          else n.delete('q');
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
    
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }
    
    return result;
  }, [categoryFilter, teaFamilyTagFilter, inputValue, priceRange, sortBy, products]);

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
              setPriceRange([0, 50000]);
              searchParams.delete('tag');
              searchParams.delete('category');
              searchParams.delete('teaTag');
              searchParams.delete('q');
              setSearchParams(searchParams);
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
              value={priceRange[1]} 
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
              className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <span>0</span>
              <span className="font-bold text-black">{priceRange[1]}</span>
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
                  searchParams.delete('tag');
                  searchParams.delete('category');
                  setSearchParams(searchParams);
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
                    searchParams.set('category', cat.slug);
                    searchParams.delete('tag');
                    setSearchParams(searchParams);
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
                    searchParams.delete('teaTag');
                    setSearchParams(searchParams);
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
                      searchParams.set('teaTag', tag.slug);
                      setSearchParams(searchParams);
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
                {filteredProducts.length} résultat{filteredProducts.length !== 1 ? 's' : ''} pour «{' '}
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
                onChange={(e) => setSortBy(e.target.value)}
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
          <div className="py-20 text-center text-gray-500">Chargement des produits...</div>
        ) : error ? (
          <div className="py-20 text-center text-red-600">{error}</div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group flex flex-col gap-4">
                <div className={`relative ${product.bgClass} aspect-[4/5] overflow-hidden rounded-[10px] transition-transform group-hover:scale-[1.02]`}>
                  <Link
                    to={`/product/${product.slug}`}
                    className="absolute inset-0 flex items-center justify-center p-4"
                  >
                    <div className="absolute left-4 top-4 z-[1] flex items-center gap-1 rounded-[4px] bg-white/80 px-2 py-1 backdrop-blur-sm">
                      <Star className="h-3 w-3 fill-current text-black" />
                      <span className="text-xs font-bold">{product.rating}</span>
                    </div>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="relative z-0 h-auto w-[80%] object-contain drop-shadow-md"
                    />
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
                    <Heart
                      className={`h-5 w-5 ${wishIds.includes(product.id) ? 'fill-[#c45c5c] text-[#c45c5c]' : ''}`}
                    />
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
                      className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#a4a374] transition-colors"
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
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-[#1a1a1a] mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500">Essayez d'ajuster vos filtres ou votre recherche.</p>
            <button 
              onClick={() => {
                setInputValue('');
                setPriceRange([0, 50000]);
                searchParams.delete('tag');
                searchParams.delete('category');
                searchParams.delete('teaTag');
                searchParams.delete('q');
                setSearchParams(searchParams);
              }}
              className="mt-6 text-[#a4a374] font-medium hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button className="w-10 h-10 flex items-center justify-center rounded-[8px] bg-black text-white font-medium">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-[8px] hover:bg-gray-50 text-gray-600 font-medium transition-colors">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-[8px] hover:bg-gray-50 text-gray-600 font-medium transition-colors">3</button>
            <span className="text-gray-400">...</span>
            <button className="px-4 h-10 flex items-center justify-center rounded-[8px] hover:bg-gray-50 text-gray-600 font-medium transition-colors">Next &gt;</button>
          </div>
        )}
      </div>
    </div>
  );
};