import { useMemo, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useParams, useNavigate, useLocation } from 'react-router';
import { Menu, SlidersHorizontal, X } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { productMatchesQuery } from '../lib/search';
import { useCatalog } from '../lib/useCatalog';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { ProductCard } from '../features/catalog/components/ProductCard';
import { ShopFiltersPanel } from '../features/catalog/components/ShopFiltersPanel';
import { useToast } from '../hooks/useToast';
import type { UIProduct } from '../features/catalog/types';
import { useSeo } from '../hooks/useSeo';
import { trackAddToCart } from '../services/analytics/tracking';
import { getCatalogListPrice, getDefaultVariant, unitPriceForLine } from '../features/catalog/productUtils';

const SHOP_PRODUCTS_PER_PAGE = 9;

type PaginationToken = number | 'ellipsis';

function buildPaginationItems(current: number, total: number): PaginationToken[] {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const delta = 1;
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let p = current - delta; p <= current + delta; p++) {
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const result: PaginationToken[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) result.push('ellipsis');
    result.push(n);
    prev = n;
  }
  return result;
}

function isCoffeeCategorySlug(slug: string): boolean {
  return slug === 'café' || slug === 'cafes' || slug === 'cafés' || slug === 'cafe';
}

/** Filtre catégorie URL ↔ slug renvoyé par Strapi (ex. thes-bio / nos-thes-bio, tisanes / tisane). */
function productMatchesShopCategory(product: UIProduct, filterSlug: string): boolean {
  const s = product.category.slug;
  if (s === filterSlug) return true;
  if (filterSlug === 'thes-bio' && (s === 'nos-thes-bio' || s === 'the-bio')) return true;
  if (filterSlug === 'tisanes' && s === 'tisane') return true;
  if (isCoffeeCategorySlug(filterSlug) && isCoffeeCategorySlug(s)) return true;
  return false;
}

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { categorySlug } = useParams();
  const categoryFilter = categorySlug ?? searchParams.get('category') ?? '';
  const teaFamilyTagFilter = searchParams.get('teaTag') ?? '';
  const searchQuery = (searchParams.get('q') ?? '').trim();
  const sortBy = searchParams.get('sort') ?? 'popular';
  const { products, categories, tags, loading, error } = useCatalog();

  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const rawPageSize = Number(searchParams.get('pageSize') ?? String(SHOP_PRODUCTS_PER_PAGE));
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize >= 1 ? Math.min(48, Math.floor(rawPageSize)) : SHOP_PRODUCTS_PER_PAGE;

  const skipPageScrollRef = useRef(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { addItem } = useCartStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const { success, info } = useToast();

  const categoryDisplayName = useMemo(() => {
    if (!categoryFilter) return 'Catalogue';
    const hit = categories.find(
      (c) =>
        c.slug === categoryFilter ||
        (categoryFilter === 'thes-bio' && c.slug === 'nos-thes-bio') ||
        (categoryFilter === 'tisanes' && c.slug === 'tisane') ||
        (isCoffeeCategorySlug(categoryFilter) && isCoffeeCategorySlug(c.slug))
    );
    if (hit?.name) return hit.name;
    if (categoryFilter === 'thes-bio') return 'Thé bio';
    if (categoryFilter === 'tisanes') return 'Tisanes';
    if (isCoffeeCategorySlug(categoryFilter)) return 'Cafés';
    return categoryFilter.replace(/-/g, ' ');
  }, [categoryFilter, categories]);

  const selectedCategoryName = categoryFilter ? categoryDisplayName : '';
  useSeo({
    title: selectedCategoryName ? `${selectedCategoryName} - Boutique` : 'Boutique',
    description: selectedCategoryName
      ? `Découvrez notre sélection ${selectedCategoryName} avec filtres et tri.`
      : 'Catalogue Secret de Nyra: thés, infusions et accessoires.',
    canonicalPath: categoryFilter ? `/shop/category/${categoryFilter}` : '/shop',
  });

  useEffect(() => {
    if (categorySlug === 'nos-thes-bio') {
      navigate(`/shop/category/thes-bio${location.search}`, { replace: true });
      return;
    }
    if (categorySlug === 'café' || categorySlug === 'cafés' || categorySlug === 'cafe') {
      navigate(`/shop/category/cafes${location.search}`, { replace: true });
    }
  }, [categorySlug, navigate, location.search]);

  useEffect(() => {
    if (categorySlug) return;
    const catQ = searchParams.get('category');
    if (catQ === 'nos-thes-bio') {
      const next = new URLSearchParams(searchParams);
      next.set('category', 'thes-bio');
      setSearchParams(next, { replace: true });
      return;
    }
    if (catQ === 'café' || catQ === 'cafés' || catQ === 'cafe') {
      const next = new URLSearchParams(searchParams);
      next.set('category', 'cafes');
      setSearchParams(next, { replace: true });
    }
  }, [categorySlug, searchParams, setSearchParams]);

  useEffect(() => {
    if (!searchParams.has('priceMax')) return;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete('priceMax');
        return n;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categoryFilter) {
      result = result.filter((p) => productMatchesShopCategory(p, categoryFilter));
    }

    if (teaFamilyTagFilter) {
      result = result.filter((p) => p.tags.some((tag) => tag.slug === teaFamilyTagFilter));
    }

    if (searchQuery) {
      result = result.filter((p) => productMatchesQuery(p, searchQuery));
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => getCatalogListPrice(a) - getCatalogListPrice(b));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => getCatalogListPrice(b) - getCatalogListPrice(a));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [categoryFilter, teaFamilyTagFilter, searchQuery, sortBy, products]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const paginationItems = useMemo(() => buildPaginationItems(safePage, totalPages), [safePage, totalPages]);

  useEffect(() => {
    if (safePage === page) return;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('page', String(safePage));
        return n;
      },
      { replace: true }
    );
  }, [page, safePage, setSearchParams]);

  useEffect(() => {
    if (skipPageScrollRef.current) {
      skipPageScrollRef.current = false;
      return;
    }
    document.getElementById('shop-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [safePage]);

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

  const resetFilters = () => {
    updateQuery({
      category: null,
      teaTag: null,
      q: null,
      sort: 'popular',
      page: '1',
      pageSize: String(SHOP_PRODUCTS_PER_PAGE),
    });
  };

  const activeFilterCount = [categoryFilter, teaFamilyTagFilter].filter(Boolean).length;

  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  const handleAddToCart = (product: UIProduct) => {
    const def = getDefaultVariant(product);
    void addItem(product.id, { variantId: def?.id, quantity: 1 });
    trackAddToCart({ ...product, price: unitPriceForLine(product, def?.id) }, 1);
    success(`Ajouté au panier: ${product.name}`);
  };

  const handleToggleWishlist = (product: UIProduct, wished: boolean) => {
    toggleWishlist(product.id);
    info(wished ? `Retiré des favoris: ${product.name}` : `Ajouté aux favoris: ${product.name}`);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row gap-12">
      <aside className="hidden md:block w-[280px] shrink-0">
        <ShopFiltersPanel
          categories={categories}
          tags={tags}
          categoryFilter={categoryFilter}
          teaFamilyTagFilter={teaFamilyTagFilter}
          onUpdate={updateQuery}
          onReset={resetFilters}
        />
      </aside>

      <div id="shop-catalog" className="flex-1 scroll-mt-24">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span className="text-gray-300">&gt;</span>
            <span className="text-black font-medium">{categoryDisplayName}</span>
          </div>

          <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] shadow-sm transition-colors hover:border-[#a4a374] font-['Mulish',sans-serif]"
              aria-expanded={filtersOpen}
            >
              <Menu className="h-4 w-4" />
              Filtres
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a4a374] px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 font-['Mulish',sans-serif]">Trier</span>
              <select
                value={sortBy}
                onChange={(e) => updateQuery({ sort: e.target.value, page: '1' })}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-bold text-[#1a1a1a] focus:border-[#a4a374] focus:outline-none font-['Mulish',sans-serif]"
              >
                <option value="popular">Popularité</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
                <option value="rating">Mieux notés</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-['Mulish',sans-serif] text-3xl md:text-4xl font-bold text-[#1a1a1a]">{categoryDisplayName}</h1>
              {!loading && !error ? (
                <p className="mt-1 text-sm text-gray-500 font-['Mulish',sans-serif]">
                  {totalItems} produit{totalItems !== 1 ? 's' : ''}
                  {searchQuery ? (
                    <>
                      {' '}
                      pour « <span className="font-medium text-[#1a1a1a]">{searchQuery}</span> »
                    </>
                  ) : null}
                  {totalPages > 1 ? ` · page ${safePage} / ${totalPages}` : ''}
                </p>
              ) : null}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Trier par</span>
              <select
                value={sortBy}
                onChange={(e) => updateQuery({ sort: e.target.value, page: '1' })}
                className="bg-transparent border-none text-sm font-bold text-[#1a1a1a] focus:outline-none cursor-pointer"
              >
                <option value="popular">Popularité</option>
                <option value="price-low">Prix croissant</option>
                <option value="price-high">Prix décroissant</option>
                <option value="rating">Mieux notés</option>
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
                wished={isWishlisted({ id: product.id, slug: product.slug })}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun produit trouvé"
            description={searchQuery ? 'Essayez un autre terme ou ajustez vos filtres.' : 'Essayez d\'ajuster vos filtres.'}
            className="py-20"
            action={
              <button
                type="button"
                onClick={resetFilters}
                className="text-[#a4a374] font-medium hover:underline"
              >
                Réinitialiser les filtres
              </button>
            }
          />
        )}

        {totalItems > 0 && (
          <nav
            className="mt-12 flex flex-col items-center gap-3 font-['Mulish',sans-serif]"
            aria-label="Pagination du catalogue"
          >
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
              <button
                type="button"
                aria-label="Page précédente"
                onClick={() => updateQuery({ page: String(safePage - 1) })}
                disabled={safePage <= 1}
                className="rounded-md px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#1a1a1a] active:scale-95 disabled:pointer-events-none disabled:opacity-35 disabled:hover:bg-transparent"
              >
                &lt; Précédent
              </button>

              {paginationItems.map((item, i) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${i}`} className="select-none px-1.5 text-base text-gray-400" aria-hidden>
                    …
                  </span>
                ) : item === safePage ? (
                  <span
                    key={`page-${item}`}
                    aria-current="page"
                    className="flex min-h-9 min-w-9 items-center justify-center rounded-md bg-[#1a1a1a] px-2 text-sm font-semibold text-white"
                  >
                    {item}
                  </span>
                ) : (
                  <button
                    key={`page-${item}`}
                    type="button"
                    aria-label={`Page ${item}`}
                    onClick={() => updateQuery({ page: String(item) })}
                    className="flex min-h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 active:scale-95"
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                aria-label="Page suivante"
                onClick={() => updateQuery({ page: String(safePage + 1) })}
                disabled={safePage >= totalPages}
                className="rounded-md px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#1a1a1a] active:scale-95 disabled:pointer-events-none disabled:opacity-35 disabled:hover:bg-transparent"
              >
                Suivant &gt;
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 tabular-nums">
              Produits {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalItems)} sur {totalItems}
            </p>
          </nav>
        )}
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fermer les filtres"
            onClick={() => setFiltersOpen(false)}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-[min(100%,320px)] flex-col bg-white shadow-2xl nyra-menu-enter"
            role="dialog"
            aria-modal="true"
            aria-label="Filtres du catalogue"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <div className="flex items-center gap-2 font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">
                <SlidersHorizontal className="h-5 w-5" />
                Filtres
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <ShopFiltersPanel
                categories={categories}
                tags={tags}
                categoryFilter={categoryFilter}
                teaFamilyTagFilter={teaFamilyTagFilter}
                onUpdate={updateQuery}
                onReset={() => {
                  resetFilters();
                  setFiltersOpen(false);
                }}
                onFilterApplied={() => setFiltersOpen(false)}
                showTitle={false}
              />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
};
