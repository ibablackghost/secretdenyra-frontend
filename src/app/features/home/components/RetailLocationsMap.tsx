import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search } from 'lucide-react';
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

    return () => {
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

  return <div ref={containerRef} className="sdn-retail-map h-full min-h-[360px] w-full lg:min-h-[520px]" />;
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
  if (items.length === 0) {
    return <p className="px-4 py-6 text-sm text-gray-500">{emptyLabel}</p>;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {items.map((loc) => {
        const active = selectedId === loc.id;
        return (
          <li key={loc.id}>
            <button
              type="button"
              onClick={() => onSelect(loc)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                active ? 'bg-[#f5f2ea]' : 'hover:bg-gray-50'
              }`}
            >
              <span
                className={`mt-0.5 flex h-10 w-8 shrink-0 items-center justify-center rounded-md border-2 bg-[#faf9f6] shadow-sm ${
                  active ? 'border-[#1a1a1a] ring-2 ring-[#a4a374]' : 'border-white'
                }`}
              >
                <img src={RETAIL_SACHET_IMAGE} alt="" className="sdn-list-sachet" loading="lazy" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#1a1a1a]">{loc.name}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{loc.locality}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function RetailLocationsMap() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<RetailLocation | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RETAIL_LOCATIONS;
    return RETAIL_LOCATIONS.filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.locality.toLowerCase().includes(q)
    );
  }, [query]);

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

      <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[minmax(280px,360px)_1fr]">
          <div className="border-b border-gray-100 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-100 p-4">
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
            </div>
            <div className="max-h-[320px] overflow-y-auto lg:max-h-[520px]">
              <RetailList
                items={filtered}
                selectedId={selected?.id ?? null}
                onSelect={(loc) => setSelected(loc)}
                emptyLabel={t('home.retail.empty')}
              />
            </div>
          </div>

          <div className="relative z-0 isolate min-h-[360px] overflow-hidden lg:min-h-[520px]">
            <RetailLeafletMap selected={selected} onSelect={setSelected} filtered={filtered} />
          </div>
        </div>
      </div>
    </section>
  );
}
