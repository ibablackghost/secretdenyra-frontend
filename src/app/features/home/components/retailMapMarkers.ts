import teaSachetMarker from '@/assets/4503-1769094130-51836-1.webp';
import L from 'leaflet';

const MARKER_W = 36;
const MARKER_TOTAL_H = 52;

export const RETAIL_SACHET_IMAGE = teaSachetMarker;

export function createSachetIcon(active = false) {
  const scale = active ? 1.12 : 1;
  const border = active ? '#1a1a1a' : '#ffffff';
  const ring = active ? '0 0 0 2px #a4a374' : 'none';

  return L.divIcon({
    className: 'sdn-sachet-marker-wrap',
    html: `
      <div class="sdn-sachet-marker${active ? ' sdn-sachet-marker--active' : ''}" style="transform:scale(${scale})">
        <div class="sdn-sachet-marker__bag" style="border-color:${border};box-shadow:${ring},0 6px 14px rgba(0,0,0,.2)">
          <img src="${teaSachetMarker}" alt="" loading="lazy" />
        </div>
        <span class="sdn-sachet-marker__dot"></span>
      </div>
    `,
    iconSize: [MARKER_W, MARKER_TOTAL_H],
    iconAnchor: [MARKER_W / 2, MARKER_TOTAL_H],
    popupAnchor: [0, -MARKER_TOTAL_H + 4],
  });
}
