import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { UICategory, UITag } from '../types';

type ShopFiltersPanelProps = {
  categories: UICategory[];
  tags: UITag[];
  categoryFilter: string;
  teaFamilyTagFilter: string;
  onUpdate: (entries: Record<string, string | null>) => void;
  onReset: () => void;
  onFilterApplied?: () => void;
  showTitle?: boolean;
};

export function ShopFiltersPanel({
  categories,
  tags,
  categoryFilter,
  teaFamilyTagFilter,
  onUpdate,
  onReset,
  onFilterApplied,
  showTitle = true,
}: ShopFiltersPanelProps) {
  const apply = (entries: Record<string, string | null>) => {
    onUpdate(entries);
    onFilterApplied?.();
  };

  return (
    <div className="space-y-8">
      {showTitle ? (
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-[#1a1a1a] font-bold text-xl font-['Mulish',sans-serif]">
            <SlidersHorizontal className="w-5 h-5" />
            Filtres
          </div>
          <button
            type="button"
            onClick={onReset}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-colors"
            aria-label="Réinitialiser les filtres"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">Effets recherchés</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-[#f4e79b] border-2 border-transparent focus:border-black hover:scale-110 transition-transform shadow-sm flex items-center justify-center group relative"
          >
            <span className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Énergie
            </span>
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-[#8bb587] border-2 border-transparent focus:border-black hover:scale-110 transition-transform shadow-sm flex items-center justify-center group relative"
          >
            <span className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Sommeil
            </span>
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-[#527d5e] border-2 border-transparent focus:border-black hover:scale-110 transition-transform shadow-sm flex items-center justify-center group relative"
          >
            <span className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Digestion
            </span>
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-[#272824] border-2 border-transparent focus:border-black hover:scale-110 transition-transform shadow-sm flex items-center justify-center group relative"
          >
            <span className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Détox
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">Format</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-10 px-4 flex items-center justify-center border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:border-black focus:border-black focus:text-black transition-colors"
          >
            Vrac 50g
          </button>
          <button
            type="button"
            className="h-10 px-4 flex items-center justify-center border-2 border-black rounded-[8px] text-sm font-bold text-black transition-colors"
          >
            Vrac 100g
          </button>
          <button
            type="button"
            className="h-10 px-4 flex items-center justify-center border border-gray-200 rounded-[8px] text-sm font-medium text-gray-600 hover:border-black focus:border-black focus:text-black transition-colors"
          >
            Boîte 20s
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">Catégories</h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="shop-category"
              checked={!categoryFilter}
              onChange={() => apply({ category: null, page: '1' })}
              className="w-4 h-4 text-black border-gray-300 focus:ring-black cursor-pointer accent-black"
            />
            <span className={`text-sm ${!categoryFilter ? 'font-bold text-black' : 'text-gray-600 group-hover:text-black'}`}>
              Tous nos thés
            </span>
          </label>
          {categories.map((cat) => (
            <label key={cat.slug} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="shop-category"
                checked={categoryFilter === cat.slug}
                onChange={() => apply({ category: cat.slug, page: '1' })}
                className="w-4 h-4 text-black border-gray-300 focus:ring-black cursor-pointer accent-black"
              />
              <span
                className={`text-sm ${categoryFilter === cat.slug ? 'font-bold text-black' : 'text-gray-600 group-hover:text-black'}`}
              >
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">Famille de thé (tags)</h3>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="shop-teaTag"
                checked={!teaFamilyTagFilter}
                onChange={() => apply({ teaTag: null, page: '1' })}
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
                  name="shop-teaTag"
                  checked={teaFamilyTagFilter === tag.slug}
                  onChange={() => apply({ teaTag: tag.slug, page: '1' })}
                  className="w-4 h-4 text-black border-gray-300 focus:ring-black cursor-pointer accent-black"
                />
                <span
                  className={`text-sm ${teaFamilyTagFilter === tag.slug ? 'font-bold text-black' : 'text-gray-600 group-hover:text-black'}`}
                >
                  {tag.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
