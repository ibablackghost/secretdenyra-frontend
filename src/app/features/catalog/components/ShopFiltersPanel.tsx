import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import {
  SHOP_EFFECT_FILTERS,
  type ShopFormatOption,
} from '../shopFilters';
import type { UICategory, UITag } from '../types';

type ShopFiltersPanelProps = {
  categories: UICategory[];
  tags: UITag[];
  categoryFilter: string;
  teaFamilyTagFilter: string;
  effectFilter: string;
  formatFilter: string;
  availableFormats: ShopFormatOption[];
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
  effectFilter,
  formatFilter,
  availableFormats,
  onUpdate,
  onReset,
  onFilterApplied,
  showTitle = true,
}: ShopFiltersPanelProps) {
  const apply = (entries: Record<string, string | null>) => {
    onUpdate(entries);
    onFilterApplied?.();
  };

  const toggleEffect = (slug: string) => {
    apply({ effect: effectFilter === slug ? null : slug, page: '1' });
  };

  const toggleFormat = (key: string) => {
    apply({ format: formatFilter === key ? null : key, page: '1' });
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
        <div className="flex items-center gap-3 flex-wrap">
          {SHOP_EFFECT_FILTERS.map((effect) => {
            const selected = effectFilter === effect.slug;
            return (
              <button
                key={effect.slug}
                type="button"
                onClick={() => toggleEffect(effect.slug)}
                aria-pressed={selected}
                aria-label={`Filtrer par ${effect.label}`}
                className={`w-10 h-10 rounded-full border-2 shadow-sm flex items-center justify-center group relative transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                  selected ? 'border-black scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: effect.color }}
              >
                <span className="absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {effect.label}
                </span>
              </button>
            );
          })}
        </div>
        {effectFilter ? (
          <p className="text-xs text-gray-500">
            Effet actif :{' '}
            <span className="font-semibold text-[#1a1a1a]">
              {SHOP_EFFECT_FILTERS.find((item) => item.slug === effectFilter)?.label ?? effectFilter}
            </span>
          </p>
        ) : null}
      </div>

      {availableFormats.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-[#1a1a1a] font-['Mulish',sans-serif]">Format</h3>
          <div className="flex flex-wrap gap-2">
            {availableFormats.map((format) => {
              const selected = formatFilter === format.key;
              return (
                <button
                  key={format.key}
                  type="button"
                  onClick={() => toggleFormat(format.key)}
                  aria-pressed={selected}
                  className={`h-10 px-4 flex items-center justify-center rounded-[8px] text-sm transition-colors ${
                    selected
                      ? 'border-2 border-black font-bold text-black'
                      : 'border border-gray-200 font-medium text-gray-600 hover:border-black focus:border-black focus:text-black'
                  }`}
                >
                  {format.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

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
