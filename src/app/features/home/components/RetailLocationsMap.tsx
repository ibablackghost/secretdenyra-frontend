import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronDown, Search } from 'lucide-react';
import {
  RETAIL_LOCATIONS,
  RETAIL_MAP_CENTER,
  RETAIL_MAP_ZOOM,
  type RetailLocation,
} from '../../../data/retailLocations';
import { useI18n } from '../../../hooks/useI18n';
import { createSachetIcon, RETAIL_SACHET_IMAGE } from './retailMapMarkers';
import './RetailLocationsMap.css';

function RetailLeafletMap({
  selected,
  onSelect,
  filtered,
}: {
  selected: RetailLocation | null;
  onSelect: (loc: RetailLocation | null) => void;
  filtered: RetailLocation[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: false,
    }).setView([RETAIL_MAP_CENTER.lat, RETAIL_MAP_CENTER.lng], RETAIL_MAP_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    const invalidate = () => map.invalidateSize();
    const timeoutId = window.setTimeout(invalidate, 80);
    const observer = new ResizeObserver(invalidate);
    observer.observe(containerRef.current);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = markersRef.current;
    const visibleIds = new Set(filtered.map((loc) => loc.id));

    for (const [id, marker] of markers) {
      if (!visibleIds.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }

    for (const loc of filtered) {
      const active = selected?.id === loc.id;
      let marker = markers.get(loc.id);
      if (!marker) {
        marker = L.marker([loc.lat, loc.lng], { icon: createSachetIcon(active) })
          .addTo(map)
          .bindPopup(
            `<strong style="font-size:13px;color:#1a1a1a">${loc.name}</strong><br/><span style="font-size:12px;color:#666">${loc.locality}</span>`
          );
        marker.on('click', () => onSelect(loc));
        markers.set(loc.id, marker);
      } else {
        marker.setIcon(createSachetIcon(active));
        marker.setLatLng([loc.lat, loc.lng]);
      }
    }
  }, [filtered, selected, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 12), { duration: 0.6 });
    const marker = markersRef.current.get(selected.id);
    marker?.openPopup();
  }, [selected]);

  return <div ref={containerRef} className="sdn-retail-map h-full min-h-[240px] w-full lg:min-h-[520px]" />;
}

function groupByLocality(items: RetailLocation[]) {
  const groups = new Map<string, RetailLocation[]>();
  for (const loc of items) {
    const list = groups.get(loc.locality) ?? [];
    list.push(loc);
    groups.set(loc.locality, list);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], 'fr'));
}

function RetailMobileSelect({
  items,
  selectedId,
  onSelect,
  placeholder,
  emptyLabel,
}: {
  items: RetailLocation[];
  selectedId: string | null;
  onSelect: (loc: RetailLocation) => void;
  placeholder: string;
  emptyLabel: string;
}) {
  const groups = useMemo(() => groupByLocality(items), [items]);

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">{emptyLabel}</p>;
  }

  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <select
        value={selectedId ?? ''}
        onChange={(e) => {
          const loc = items.find((item) => item.id === e.target.value);
          if (loc) onSelect(loc);
        }}
        className="sdn-retail-select w-full appearance-none rounded-xl border border-gray-200 bg-[#fafafa] py-3 pl-4 pr-11 text-sm text-[#1a1a1a] outline-none ring-[#a4a374] focus:border-[#a4a374] focus:ring-1"
      >
        <option value="">{placeholder}</option>
        {groups.map(([locality, locations]) => (
          <optgroup key={locality} label={locality}>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </label>
  );
}

function RetailList({
  items,
  selectedId,
  onSelect,
  emptyLabel,
}: {
  items: RetailLocation[];
  selectedId: string | null;
  onSelect: (loc: RetailLocation) => void;
  emptyLabel: string;
}) {
  const groups = useMemo(() => groupByLocality(items), [items]);

  if (items.length === 0) {
    return <p className="px-4 py-6 text-sm text-gray-500">{emptyLabel}</p>;
  }

  return (
    <div>
      {groups.map(([locality, locations]) => (
        <div key={locality}>
          <p className="sticky top-0 z-[1] bg-[#faf9f6] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#8a8a62]">
            {locality}
            <span className="ml-1.5 font-medium normal-case tracking-normal text-gray-400">{locations.length}</span>
          </p>
          <ul>
            {locations.map((loc) => {
              const active = selectedId === loc.id;
              return (
                <li key={loc.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(loc)}
                    className={`flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      active ? 'bg-[#f5f2ea]' : 'active:bg-gray-50 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-7 shrink-0 items-center justify-center rounded-md border bg-[#fff] ${
                        active ? 'border-[#1a1a1a]' : 'border-gray-100'
                      }`}
                    >
                      <img src={RETAIL_SACHET_IMAGE} alt="" className="sdn-list-sachet h-7 w-5" loading="lazy" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold leading-snug text-[#1a1a1a] md:whitespace-normal md:text-sm">
                        {loc.name}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function RetailLocationsMap() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RetailLocation | null>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RETAIL_LOCATIONS;
    return RETAIL_LOCATIONS.filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.locality.toLowerCase().includes(q)
    );
  }, [query]);

  const selectLocation = (loc: RetailLocation) => {
    setSelected(loc);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      mapWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-20">
      <div className="mb-8 md:mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#a4a374]">{t('home.retail.eyebrow')}</p>
        <h2 className="mt-2 font-['Mulish',sans-serif] text-2xl md:text-3xl font-semibold text-[#303030]">
          {t('home.retail.title')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm md:text-base text-gray-600">
          {t('home.retail.sub', { count: RETAIL_LOCATIONS.length })}
        </p>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm md:rounded-[24px]">
        <div className="p-3 lg:hidden">
          <RetailMobileSelect
            items={RETAIL_LOCATIONS}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            placeholder={t('home.retail.selectPlaceholder')}
            emptyLabel={t('home.retail.empty')}
          />
        </div>

        <div className="grid lg:grid-cols-[minmax(280px,360px)_1fr]">
          <div
            ref={mapWrapRef}
            className="relative z-0 isolate h-[62vw] min-h-[260px] max-h-[420px] overflow-hidden lg:h-auto lg:min-h-[520px] lg:max-h-none"
          >
            <RetailLeafletMap selected={selected} onSelect={setSelected} filtered={filtered} />
          </div>

          <div className="hidden min-h-0 flex-col border-t border-gray-100 lg:flex lg:border-t-0 lg:border-r lg:order-first">
            <div className="border-b border-gray-100 bg-white p-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('home.retail.search')}
                  className="w-full rounded-xl border border-gray-200 bg-[#fafafa] py-2.5 pl-10 pr-3 text-sm outline-none ring-[#a4a374] focus:border-[#a4a374] focus:ring-1"
                />
              </label>
              <p className="mt-2 px-0.5 text-xs text-gray-500">
                {t(filtered.length === 1 ? 'home.retail.count' : 'home.retail.count_plural', {
                  count: filtered.length,
                })}
              </p>
            </div>
            <div className="sdn-retail-list max-h-[520px] overflow-y-auto">
              <RetailList
                items={filtered}
                selectedId={selected?.id ?? null}
                onSelect={selectLocation}
                emptyLabel={t('home.retail.empty')}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
