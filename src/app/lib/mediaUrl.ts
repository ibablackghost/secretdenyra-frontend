/** Résout une URL média Strapi (string ou `{ url }`) en URL absolue. */
export function resolveMediaUrl(image: unknown): string {
  let raw = '';
  if (typeof image === 'string') {
    raw = image.trim();
  } else if (image && typeof image === 'object') {
    const record = image as Record<string, unknown>;
    if (typeof record.url === 'string') raw = record.url.trim();
    else if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>;
      const attrs = nested.attributes && typeof nested.attributes === 'object'
        ? (nested.attributes as Record<string, unknown>)
        : nested;
      if (typeof attrs.url === 'string') raw = attrs.url.trim();
    }
  }
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;

  const base = String(import.meta.env.VITE_STRAPI_URL ?? '').replace(/\/$/, '');
  if (!base) return raw;
  return raw.startsWith('/') ? `${base}${raw}` : `${base}/${raw}`;
}
