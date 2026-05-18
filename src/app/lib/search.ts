import type { UIProduct } from '../features/catalog/types';

/** Normalise pour recherche insensible aux accents / casse */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function productMatchesQuery(product: UIProduct, rawQuery: string): boolean {
  const q = normalizeForSearch(rawQuery);
  if (!q) return true;

  const haystack = normalizeForSearch(
    [
      product.name,
      product.ingredients,
      product.shortDescription ?? '',
      product.description ?? '',
      product.category.name,
      product.category.slug,
      ...product.tags.map((t) => t.name),
      ...product.tags.map((t) => t.slug),
    ].join(' ')
  );

  return q.split(/\s+/).filter(Boolean).every((token) => haystack.includes(token));
}
