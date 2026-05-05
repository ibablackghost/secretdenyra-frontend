/** Normalise pour recherche insensible aux accents / casse */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function productMatchesQuery(
  product: {
    id: string;
    name: string;
    ingredients: string;
    category: string | { slug: string; name: string };
  },
  rawQuery: string
): boolean {
  const q = normalizeForSearch(rawQuery);
  if (!q) return true;
  const categoryText =
    typeof product.category === 'string'
      ? product.category
      : `${product.category.name} ${product.category.slug}`;
  const haystack = normalizeForSearch(
    `${product.name} ${product.ingredients} ${categoryText} ${product.id}`
  );
  return haystack.includes(q);
}
