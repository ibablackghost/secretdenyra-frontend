import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, X } from 'lucide-react';
import { useCatalog } from '@/app/hooks/useCatalog';
import { MediaImage } from '@/app/components/ui/MediaImage';
import { productMatchesQuery } from '@/app/lib/search';

type HeaderSearchPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function HeaderSearchPanel({ open, onClose }: HeaderSearchPanelProps) {
  const navigate = useNavigate();
  const { products } = useCatalog();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return products.filter((p) => productMatchesQuery(p, q)).slice(0, 6);
  }, [query, products]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const runSearch = (e?: FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    onClose();
    if (q) navigate(`/shop?q=${encodeURIComponent(q)}`);
    else navigate('/shop');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Fermer la recherche"
        onClick={onClose}
      />
      <div
        className="relative mx-auto w-full max-w-[640px] px-4 pt-[max(1rem,env(safe-area-inset-top))] nyra-menu-enter"
        role="dialog"
        aria-modal="true"
        aria-label="Rechercher un produit"
      >
        <form
          onSubmit={runSearch}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Thé, infusion, ingrédient…"
              className="min-w-0 flex-1 border-0 bg-transparent py-3 font-['Mulish',sans-serif] text-base text-[#1a1a1a] outline-none placeholder:text-gray-400"
              aria-label="Recherche produits"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {suggestions.length > 0 ? (
            <ul className="max-h-[min(50vh,320px)] overflow-auto p-2">
              {suggestions.map((product) => (
                <li key={product.id}>
                  <Link
                    to={`/product/${product.slug}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-gray-50"
                    onClick={onClose}
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white">
                      <MediaImage
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        fallbackClassName="h-full w-full rounded-none text-[9px]"
                      />
                    </div>
                    <span className="line-clamp-2 text-sm font-medium text-[#1a1a1a]">{product.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 2 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500 font-['Mulish',sans-serif]">
              Aucun produit trouvé. Appuyez sur <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold">Entrée</kbd> pour voir le catalogue filtré.
            </p>
          ) : (
            <p className="px-4 py-4 text-center text-xs text-gray-400 font-['Mulish',sans-serif]">
              Saisissez au moins 2 caractères ou validez avec <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold">Entrée</kbd>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

